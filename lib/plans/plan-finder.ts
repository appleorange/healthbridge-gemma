import type { UserProfile, PlanCard, PlanType, BenefitPriority } from '@/types'

// ── Fit score calculator ─────────────────────────────────────────────────────

function calcFitScore(plan: Omit<PlanCard, 'fitScore' | 'fitReasons'>, profile: UserProfile): { score: number; reasons: string[] } {
  let score = 60
  const reasons: string[] = []
  const priorities = profile.benefitPriorities ?? []

  // Premium budget check
  const effectivePremium = plan.subsidizedPremium ?? plan.monthlyPremium
  const budget = profile.monthlyPremiumBudget as string
  if (budget && budget !== 'flexible') {
    const cap = budget === 'under_100' ? 100 : budget === '100_to_300' ? 300 : budget === '300_to_500' ? 500 : 9999
    if (effectivePremium <= cap) { score += 10; reasons.push(`$${effectivePremium}/mo premium fits your budget`) }
    else { score -= 15 }
  }

  if (effectivePremium === 0) { score += 8; reasons.push('$0 monthly premium') }

  // Usage vs plan tier alignment
  const usage = profile.expectedHealthcareUsage
  if (usage === 'minimal' && plan.deductible > 3000) { score += 5; reasons.push('High-deductible plan suits low usage') }
  if (usage === 'high' && plan.oopMax < 4000) { score += 12; reasons.push('Low out-of-pocket max for frequent care') }
  if (usage === 'high' && plan.deductible > 5000) { score -= 10 }

  // Hospital visit frequency
  const hosp = profile.hospitalVisitFrequency
  if (hosp === 'regularly' || hosp === 'monthly') {
    if (plan.oopMax < 5000) { score += 8; reasons.push('Good hospital coverage for frequent visits') }
  }

  // Benefit priorities matching
  const coveredBenefits = plan.benefits.filter(b => b.covered).map(b => b.label.toLowerCase())
  for (const priority of priorities) {
    const label = BENEFIT_LABEL_MAP[priority]
    if (label && coveredBenefits.some(b => b.includes(label.toLowerCase()))) {
      score += 5
      if (reasons.length < 3) reasons.push(`Includes ${label}`)
    }
  }

  // Prescriptions
  if (profile.takesRegularMedications) {
    if (plan.networkType !== 'ISP') { score += 5; reasons.push('Covers prescriptions') }
  }

  // Network type preference
  if (priorities.includes('specialist_access') && plan.networkType === 'PPO') {
    score += 8; reasons.push('PPO — no referral needed for specialists')
  }
  if (plan.networkType === 'HMO' && priorities.includes('specialist_access')) score -= 5

  // PCP / specialist copays
  if (plan.pcpCopay !== null && plan.pcpCopay <= 20) { score += 5; reasons.push(`Low PCP copay ($${plan.pcpCopay})`) }
  if (plan.specialistCopay !== null && plan.specialistCopay <= 30) score += 3

  // CMS star rating bonus
  if (plan.rating) score += Math.round((plan.rating - 3) * 3)

  return { score: Math.min(100, Math.max(10, score)), reasons: reasons.slice(0, 4) }
}

const BENEFIT_LABEL_MAP: Record<BenefitPriority, string> = {
  vision: 'Vision', dental: 'Dental', hearing: 'Hearing',
  mental_health: 'Mental health', maternity: 'Maternity',
  prescriptions: 'Prescriptions', fitness: 'Fitness',
  transportation: 'Transportation', over_the_counter: 'Over the Counter',
  specialist_access: 'Specialist', emergency_care: 'Emergency',
}

// ── Healthcare.gov API (real ACA plans by zipcode) ───────────────────────────

async function fetchACAPlans(profile: UserProfile): Promise<PlanCard[]> {
  if (!profile.zipCode) return []

  const year = 2026
  const income = profile.annualIncome || 30000
  const apiKey = process.env.HEALTHCARE_GOV_API_KEY || 'default'

  try {
    const body = {
      household: {
        income,
        people: [
          { age: profile.age, aptc_eligible: true, is_pregnant: false, uses_tobacco: false }
        ],
      },
      market: 'Individual',
      place: { zipcode: profile.zipCode, state: profile.state, countyfips: '' },
      year,
    }

    const res = await fetch(
      `https://marketplace.api.healthcare.gov/api/v1/plans/search?apikey=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )

    if (!res.ok) return []
    const data = await res.json()

    const plans: Omit<PlanCard, 'fitScore' | 'fitReasons'>[] = (data.plans ?? []).slice(0, 8).map((p: Record<string, unknown>) => {
      const benefits = buildBenefitChips(p)
      return {
        id: p.id as string,
        name: p.name as string,
        issuer: (p.issuer as Record<string, string>)?.name ?? 'Unknown',
        planType: 'aca_marketplace' as PlanType,
        networkType: normalizeNetwork(p.type as string),
        metalTier: (p.metal_level as string) as PlanCard['metalTier'],
        monthlyPremium: Math.round((p.premium as number) ?? 0),
        subsidizedPremium: (p.premium_w_credit as number) ? Math.round(p.premium_w_credit as number) : undefined,
        deductible: (p.deductibles as { amount: number }[])?.[0]?.amount ?? 5000,
        oopMax: (p.moops as { amount: number }[])?.[0]?.amount ?? 8000,
        pcpCopay: parseCopay(p.benefits as Record<string, unknown>[], 'Primary Care Visit'),
        specialistCopay: parseCopay(p.benefits as Record<string, unknown>[], 'Specialist Visit'),
        benefits,
        planUrl: `https://www.healthcare.gov/see-plans/#/plan/${p.id}`,
        isReal: true,
        year,
        rating: (p.quality_rating as Record<string, number>)?.global_rating ?? undefined,
      }
    })

    return plans.map(p => {
      const { score, reasons } = calcFitScore(p, profile)
      return { ...p, fitScore: score, fitReasons: reasons }
    }).sort((a, b) => b.fitScore - a.fitScore)

  } catch {
    return []
  }
}

function normalizeNetwork(type: string): PlanCard['networkType'] {
  const t = (type ?? '').toUpperCase()
  if (t.includes('PPO')) return 'PPO'
  if (t.includes('HMO')) return 'HMO'
  if (t.includes('EPO')) return 'EPO'
  if (t.includes('HDHP')) return 'HDHP'
  return 'Other'
}

function parseCopay(benefits: Record<string, unknown>[], name: string): number | null {
  if (!Array.isArray(benefits)) return null
  const b = benefits.find((x: Record<string, unknown>) => (x.name as string)?.includes(name))
  if (!b) return null
  const val = (b as Record<string, unknown>).copay_before_deductible as string
  if (!val || val === 'Not Applicable') return null
  const match = val.match(/\$?([\d.]+)/)
  return match ? Math.round(parseFloat(match[1])) : null
}

function buildBenefitChips(plan: Record<string, unknown>): { label: string; covered: boolean }[] {
  const benefits = plan.benefits as { name: string; covered: string }[] | undefined
  const covered = (name: string) => !!(benefits ?? []).find(b => b.name?.includes(name) && b.covered !== 'Not Covered')
  return [
    { label: 'Vision', covered: covered('Vision') || !!(plan.benefits_url) },
    { label: 'Dental', covered: covered('Dental') },
    { label: 'Mental health', covered: covered('Mental') },
    { label: 'Maternity', covered: covered('Maternity') },
    { label: 'Prescriptions', covered: covered('Drug') },
    { label: 'Fitness', covered: !!(plan.wellness_program) },
    { label: 'Transportation', covered: false },
    { label: 'Over the Counter', covered: false },
  ]
}

// ── Mocked plans for non-ACA-eligible users ──────────────────────────────────

function getMockedPlans(profile: UserProfile): PlanCard[] {
  const { immigrationStatus, isStudent, state } = profile
  const isF1J1 = ['f1_student', 'f1_opt', 'j1_scholar', 'j2'].includes(immigrationStatus)
  const year = 2026

  const plans: Omit<PlanCard, 'fitScore' | 'fitReasons'>[] = []

  // ── Student plans ──
  if (isStudent || isF1J1) {
    const uniName = profile.university ?? 'your university'

    plans.push({
      id: 'ship_mock',
      name: `${uniName} Student Health Insurance Plan`,
      issuer: uniName,
      planType: 'school_plan',
      networkType: 'SHIP',
      monthlyPremium: 180,
      deductible: 250,
      oopMax: 2500,
      pcpCopay: 20,
      specialistCopay: 40,
      benefits: [
        { label: 'Vision', covered: true },
        { label: 'Dental', covered: false },
        { label: 'Mental health', covered: true },
        { label: 'Maternity', covered: true },
        { label: 'Prescriptions', covered: true },
        { label: 'Fitness', covered: false },
        { label: 'Transportation', covered: false },
        { label: 'Over the Counter', covered: false },
      ],
      planUrl: undefined,
      isReal: false,
      year,
      rating: undefined,
    })

    plans.push({
      id: 'isp_mock_1',
      name: 'ISO Student Health Plus',
      issuer: 'International Student Organization',
      planType: 'international_student_plan',
      networkType: 'PPO',
      monthlyPremium: 95,
      deductible: 500,
      oopMax: 5000,
      pcpCopay: 30,
      specialistCopay: 50,
      benefits: [
        { label: 'Vision', covered: false },
        { label: 'Dental', covered: false },
        { label: 'Mental health', covered: true },
        { label: 'Maternity', covered: false },
        { label: 'Prescriptions', covered: true },
        { label: 'Fitness', covered: false },
        { label: 'Transportation', covered: false },
        { label: 'Over the Counter', covered: false },
      ],
      planUrl: 'https://www.isoa.org',
      isReal: false,
      year,
    })

    plans.push({
      id: 'isp_mock_2',
      name: 'Cultural Insurance Services (CISI) Scholar',
      issuer: 'CISI',
      planType: 'international_student_plan',
      networkType: 'PPO',
      monthlyPremium: 72,
      deductible: 100,
      oopMax: 3000,
      pcpCopay: 25,
      specialistCopay: 45,
      benefits: [
        { label: 'Vision', covered: false },
        { label: 'Dental', covered: false },
        { label: 'Mental health', covered: true },
        { label: 'Maternity', covered: false },
        { label: 'Prescriptions', covered: true },
        { label: 'Fitness', covered: false },
        { label: 'Transportation', covered: false },
        { label: 'Over the Counter', covered: false },
      ],
      planUrl: 'https://www.culturalinsurance.com',
      isReal: false,
      year,
    })
  }

  // ── H-1B / employer-sponsored mock ──
  if (['h1b', 'l1', 'o1', 'tn'].includes(immigrationStatus)) {
    plans.push({
      id: 'employer_mock',
      name: 'Employer Health Plan (Estimated)',
      issuer: profile.employerName ?? 'Your employer',
      planType: 'employer_sponsored',
      networkType: 'PPO',
      monthlyPremium: 180,
      deductible: 1500,
      oopMax: 5000,
      pcpCopay: 25,
      specialistCopay: 50,
      benefits: [
        { label: 'Vision', covered: true },
        { label: 'Dental', covered: true },
        { label: 'Mental health', covered: true },
        { label: 'Maternity', covered: true },
        { label: 'Prescriptions', covered: true },
        { label: 'Fitness', covered: false },
        { label: 'Transportation', covered: false },
        { label: 'Over the Counter', covered: false },
      ],
      isReal: false,
      year,
    })
  }

  // ── Short-term fallback for anyone ──
  plans.push({
    id: 'short_term_mock',
    name: 'HealthMarkets Short-Term Plan',
    issuer: 'HealthMarkets',
    planType: 'short_term',
    networkType: 'PPO',
    monthlyPremium: 85,
    deductible: 5000,
    oopMax: 20000,
    pcpCopay: 50,
    specialistCopay: 100,
    benefits: [
      { label: 'Vision', covered: false },
      { label: 'Dental', covered: false },
      { label: 'Mental health', covered: false },
      { label: 'Maternity', covered: false },
      { label: 'Prescriptions', covered: false },
      { label: 'Fitness', covered: false },
      { label: 'Transportation', covered: false },
      { label: 'Over the Counter', covered: false },
    ],
    isReal: false,
    year,
  })

  return plans.map(p => {
    const { score, reasons } = calcFitScore(p, profile)
    return { ...p, fitScore: score, fitReasons: reasons }
  }).sort((a, b) => b.fitScore - a.fitScore)
}

// ── Main entry point ─────────────────────────────────────────────────────────

export async function getPlansForProfile(profile: UserProfile): Promise<PlanCard[]> {
  const acaEligible = ['us_citizen', 'green_card', 'refugee_asylee', 'l1', 'o1', 'tn'].includes(profile.immigrationStatus)

  if (acaEligible && profile.zipCode) {
    const real = await fetchACAPlans(profile)
    if (real.length > 0) return real
  }

  return getMockedPlans(profile)
}
