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

async function fetchCountyFips(zipCode: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch(
      `https://marketplace.api.healthcare.gov/api/v1/counties/by/zip/${zipCode}?apikey=${apiKey}`
    )
    if (!res.ok) return ''
    const data = await res.json()
    return (data.counties as { fips: string }[])?.[0]?.fips ?? ''
  } catch {
    return ''
  }
}

function extractDeductible(deductibles: unknown): number {
  if (!Array.isArray(deductibles)) return 5000
  const match = (deductibles as { type: string; cost_sharing_reduction: string; amount: number }[])
    .find(d => d.type === 'Medical EHB Deductible' && d.cost_sharing_reduction === 'No Reduction')
  return match?.amount ?? deductibles[0]?.amount ?? 5000
}

function extractOopMax(moops: unknown): number {
  if (!Array.isArray(moops)) return 8000
  const match = (moops as { type: string; cost_sharing_reduction: string; amount: number }[])
    .find(m => m.type === 'Maximum Out of Pocket Payment' && m.cost_sharing_reduction === 'No Reduction')
  return match?.amount ?? (moops as { amount: number }[])[0]?.amount ?? 8000
}

async function fetchACAPlans(profile: UserProfile): Promise<PlanCard[]> {
  if (!profile.zipCode) return []

  const year = 2026
  const income = profile.annualIncome || 30000
  const apiKey = process.env.HEALTHCARE_GOV_API_KEY || 'a94d697d-5fe2-43d5-b829-fbf1d52d9c49'

  try {
    const countyFips = await fetchCountyFips(profile.zipCode, apiKey)

    // APTC eligible if income is between 100% and 400% FPL (single person ~$15,650 in 2026)
    const fpl = 15650
    const aptcEligible = income >= fpl && income <= fpl * 4

    const body = {
      household: {
        income,
        people: [
          {
            age: profile.age ?? 30,
            aptc_eligible: aptcEligible,
            gender: 'Male',
            uses_tobacco: false,
            is_pregnant: false,
          }
        ],
      },
      market: 'Individual',
      place: {
        zipcode: profile.zipCode,
        state: profile.state ?? '',
        countyfips: countyFips,
      },
      year,
    }

    const res = await fetch(
      `https://marketplace.api.healthcare.gov/api/v1/plans/search?apikey=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )

    if (!res.ok) return []
    const data = await res.json()

    const plans: Omit<PlanCard, 'fitScore' | 'fitReasons'>[] = (data.plans ?? []).slice(0, 6).map((p: Record<string, unknown>) => {
      const benefits = buildBenefitChips(p)
      const premium = p.premium as number ?? 0
      const premiumWithCredit = p.premium_w_credit as number | undefined
      return {
        id: p.id as string,
        name: p.name as string,
        issuer: (p.issuer as Record<string, string>)?.name ?? 'Unknown',
        planType: 'aca_marketplace' as PlanType,
        networkType: normalizeNetwork(p.type as string),
        metalTier: (p.metal_level as string) as PlanCard['metalTier'],
        monthlyPremium: Math.round(premium),
        subsidizedPremium: premiumWithCredit !== undefined && premiumWithCredit < premium
          ? Math.round(premiumWithCredit)
          : undefined,
        deductible: extractDeductible(p.deductibles),
        oopMax: extractOopMax(p.moops),
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

// ── Known employer plan lookup ────────────────────────────────────────────────

export const KNOWN_EMPLOYER_PLANS: Record<string, { plans: string[]; notes: string; enrollmentTip: string }> = {
  'google':     { plans: ['Anthem PPO', 'Kaiser HMO', 'Aetna HDHP'], notes: 'Google offers 3 tiers. The HDHP with HSA is popular for healthy employees.', enrollmentTip: 'Enrollment opens in November. Check go/benefits.' },
  'amazon':     { plans: ['Premera Blue Cross PPO', 'Aetna HSA'], notes: 'Amazon covers most of the premium for full-time employees.', enrollmentTip: 'New hires have 30 days from start date to enroll.' },
  'microsoft':  { plans: ['Premera Blue Cross', 'Kaiser HMO (WA only)'], notes: 'Microsoft covers 100% of employee premium.', enrollmentTip: 'Open enrollment in October.' },
  'meta':       { plans: ['Anthem PPO', 'Kaiser HMO', 'Aetna HDHP/HSA'], notes: 'Meta covers full premium for employee and family.', enrollmentTip: 'Annual enrollment in November.' },
  'apple':      { plans: ['Anthem PPO', 'Kaiser HMO', 'Aetna HDHP'], notes: 'Apple offers generous HSA contributions on HDHP plans.', enrollmentTip: 'Enrollment in October via Workday.' },
  'hospital':   { plans: ['Employer Health Plan'], notes: 'Most hospital systems offer comprehensive plans with strong network coverage at their own facilities.', enrollmentTip: 'Check with HR — hospital employees often get discounted or free coverage.' },
  'university': { plans: ['Faculty/Staff Health Plan'], notes: 'Universities typically offer Blue Cross or Aetna plans with good specialist networks.', enrollmentTip: 'Enrollment typically in July or August for the academic year.' },
}

export function matchEmployerPlans(employerName?: string): { key: string; data: typeof KNOWN_EMPLOYER_PLANS[string] } | null {
  if (!employerName) return null
  const lower = employerName.toLowerCase()
  for (const [key, data] of Object.entries(KNOWN_EMPLOYER_PLANS)) {
    if (lower.includes(key)) return { key, data }
  }
  return null
}

function detectNetworkType(planName: string): PlanCard['networkType'] {
  const n = planName.toUpperCase()
  if (n.includes('HDHP') || n.includes('HSA')) return 'HDHP'
  if (n.includes('HMO')) return 'HMO'
  if (n.includes('EPO')) return 'EPO'
  return 'PPO'
}

function employerPlanDefaults(networkType: PlanCard['networkType']): {
  monthlyPremium: number; deductible: number; oopMax: number
  pcpCopay: number | null; specialistCopay: number | null
} {
  if (networkType === 'HDHP') return { monthlyPremium: 110, deductible: 3000, oopMax: 6500, pcpCopay: null, specialistCopay: null }
  if (networkType === 'HMO')  return { monthlyPremium: 160, deductible: 500,  oopMax: 3000, pcpCopay: 20, specialistCopay: 35 }
  return                              { monthlyPremium: 200, deductible: 1500, oopMax: 5000, pcpCopay: 25, specialistCopay: 50 }
}

const FULL_BENEFITS: PlanCard['benefits'] = [
  { label: 'Vision', covered: true }, { label: 'Dental', covered: true },
  { label: 'Mental health', covered: true }, { label: 'Maternity', covered: true },
  { label: 'Prescriptions', covered: true }, { label: 'Fitness', covered: false },
  { label: 'Transportation', covered: false }, { label: 'Over the Counter', covered: false },
]

// ── Current-plan evaluator ────────────────────────────────────────────────────

export function evaluateCurrentPlan(profile: UserProfile): { score: number; isOptimal: boolean; card: PlanCard } | null {
  if (!profile.currentlyInsured || !profile.currentPlanType) return null

  const year = 2026
  type T = Omit<PlanCard, 'fitScore' | 'fitReasons'>

  const sparse = (covered: boolean[]) => FULL_BENEFITS.map((b, i) => ({ ...b, covered: covered[i] ?? false }))

  const templates: Record<string, T> = {
    employer: {
      id: 'current_plan', isReal: false, year, isCurrentPlan: true,
      name: `Your ${profile.employerName ? profile.employerName + ' ' : ''}employer plan`,
      issuer: profile.employerName ?? 'Your employer',
      planType: 'employer_sponsored', networkType: 'PPO',
      monthlyPremium: 200, deductible: 1500, oopMax: 5000, pcpCopay: 25, specialistCopay: 50,
      benefits: sparse([true, true, true, true, true]),
    },
    aca_marketplace: {
      id: 'current_plan', isReal: false, year, isCurrentPlan: true,
      name: 'Your ACA marketplace plan', issuer: 'ACA Marketplace',
      planType: 'aca_marketplace', networkType: 'PPO',
      monthlyPremium: 350, deductible: 3000, oopMax: 7000, pcpCopay: 30, specialistCopay: 60,
      benefits: sparse([false, false, true, true, true]),
    },
    medicaid: {
      id: 'current_plan', isReal: false, year, isCurrentPlan: true,
      name: 'Your Medicaid coverage', issuer: 'Medicaid',
      planType: 'medicaid', networkType: 'Medicaid',
      monthlyPremium: 0, deductible: 0, oopMax: 500, pcpCopay: 3, specialistCopay: 5,
      benefits: sparse([false, false, true, true, true]),
    },
    school_plan: {
      id: 'current_plan', isReal: false, year, isCurrentPlan: true,
      name: `${profile.university ?? 'University'} health plan (SHIP)`,
      issuer: profile.university ?? 'University',
      planType: 'school_plan', networkType: 'SHIP',
      monthlyPremium: 180, deductible: 250, oopMax: 2500, pcpCopay: 20, specialistCopay: 40,
      benefits: sparse([true, false, true, true, true]),
    },
    isp: {
      id: 'current_plan', isReal: false, year, isCurrentPlan: true,
      name: 'Your International Student Plan', issuer: 'ISP Provider',
      planType: 'international_student_plan', networkType: 'ISP',
      monthlyPremium: 100, deductible: 500, oopMax: 5000, pcpCopay: 30, specialistCopay: 50,
      benefits: sparse([false, false, true, false, true]),
    },
    cobra: {
      id: 'current_plan', isReal: false, year, isCurrentPlan: true,
      name: 'Your COBRA continuation coverage',
      issuer: profile.employerName ?? 'Former employer',
      planType: 'cobra', networkType: 'PPO',
      monthlyPremium: 650, deductible: 1500, oopMax: 5000, pcpCopay: 25, specialistCopay: 50,
      benefits: sparse([true, true, true, true, true]),
    },
    short_term: {
      id: 'current_plan', isReal: false, year, isCurrentPlan: true,
      name: 'Your short-term health plan', issuer: 'Short-term insurer',
      planType: 'short_term', networkType: 'PPO',
      monthlyPremium: 100, deductible: 5000, oopMax: 20000, pcpCopay: 50, specialistCopay: 100,
      benefits: sparse([false, false, false, false, false]),
    },
  }

  const template = templates[profile.currentPlanType]
  if (!template) return null

  const { score, reasons } = calcFitScore(template, profile)
  return { score, isOptimal: score >= 70, card: { ...template, fitScore: score, fitReasons: reasons } }
}

// ── Eligibility-driven mocked plan builder ────────────────────────────────────

const CURRENT_PLAN_TYPE_MAP: Record<string, PlanType> = {
  employer:                'employer_sponsored',
  aca_marketplace:         'aca_marketplace',
  school_plan:             'school_plan',
  isp:                     'international_student_plan',
  medicaid:                'medicaid',
  cobra:                   'cobra',
  short_term:              'short_term',
}

function isCurrentForType(profile: UserProfile, planType: PlanType): boolean {
  if (!profile.currentlyInsured || !profile.currentPlanType) return false
  return CURRENT_PLAN_TYPE_MAP[profile.currentPlanType] === planType
}

function buildMockedCards(
  profile: UserProfile,
  eligiblePlanTypes: PlanType[]
): Omit<PlanCard, 'fitScore' | 'fitReasons' | 'isPrimaryRecommendation'>[] {
  const year = 2026
  const cards: Omit<PlanCard, 'fitScore' | 'fitReasons' | 'isPrimaryRecommendation'>[] = []

  for (const planType of eligiblePlanTypes) {
    switch (planType) {

      case 'employer_sponsored': {
        const match = matchEmployerPlans(profile.employerName)
        if (match) {
          const currentInput = profile.currentEmployerPlan?.toLowerCase().trim()
          match.data.plans.forEach((planName, idx) => {
            const networkType = detectNetworkType(planName)
            const defaults = employerPlanDefaults(networkType)
            const isCurrentEmpPlan = profile.currentlyInsured && currentInput
              ? planName.toLowerCase().includes(currentInput) || currentInput.includes(planName.toLowerCase())
              : false
            cards.push({
              id: `employer_mock_${idx}`, name: planName,
              issuer: profile.employerName ?? match.key,
              planType: 'employer_sponsored', networkType,
              ...defaults,
              benefits: FULL_BENEFITS.map((b, i) => ({ ...b, covered: [true, true, true, true, true, false, false, false][i] })),
              isReal: false, year,
              ...(isCurrentEmpPlan ? { isCurrentPlan: true } : {}),
            })
          })
        } else {
          cards.push({
            id: 'employer_mock', name: 'Employer Health Plan (Estimated)',
            issuer: profile.employerName ?? 'Your employer',
            planType: 'employer_sponsored', networkType: 'PPO',
            monthlyPremium: 180, deductible: 1500, oopMax: 5000, pcpCopay: 25, specialistCopay: 50,
            benefits: FULL_BENEFITS.map((b, i) => ({ ...b, covered: [true, true, true, true, true, false, false, false][i] })),
            isReal: false, year,
            ...(isCurrentForType(profile, 'employer_sponsored') ? { isCurrentPlan: true } : {}),
          })
        }
        break
      }

      case 'medicaid': {
        cards.push({
          id: 'medicaid_mock',
          name: `${profile.state ? profile.state + ' ' : ''}Medicaid`,
          issuer: 'Medicaid',
          planType: 'medicaid', networkType: 'Medicaid',
          monthlyPremium: 0, deductible: 0, oopMax: 500, pcpCopay: 3, specialistCopay: 5,
          benefits: FULL_BENEFITS.map((b, i) => ({ ...b, covered: [false, false, true, true, true, false, false, false][i] })),
          isReal: false, year,
          ...(isCurrentForType(profile, 'medicaid') ? { isCurrentPlan: true } : {}),
        })
        break
      }

      case 'school_plan': {
        const uniName = profile.university ?? 'Your university'
        cards.push({
          id: 'ship_mock', name: `${uniName} Student Health Insurance Plan`, issuer: uniName,
          planType: 'school_plan', networkType: 'SHIP',
          monthlyPremium: 180, deductible: 250, oopMax: 2500, pcpCopay: 20, specialistCopay: 40,
          benefits: FULL_BENEFITS.map((b, i) => ({ ...b, covered: [true, false, true, true, true, false, false, false][i] })),
          planUrl: undefined, isReal: false, year,
          ...(isCurrentForType(profile, 'school_plan') ? { isCurrentPlan: true } : {}),
        })
        break
      }

      case 'international_student_plan': {
        const isCurrent = isCurrentForType(profile, 'international_student_plan')
        cards.push(
          {
            id: 'isp_mock_1', name: 'ISO Student Health Plus', issuer: 'International Student Organization',
            planType: 'international_student_plan', networkType: 'PPO',
            monthlyPremium: 95, deductible: 500, oopMax: 5000, pcpCopay: 30, specialistCopay: 50,
            benefits: FULL_BENEFITS.map((b, i) => ({ ...b, covered: [false, false, true, false, true, false, false, false][i] })),
            planUrl: 'https://www.isoa.org', isReal: false, year,
            ...(isCurrent ? { isCurrentPlan: true } : {}),
          },
          {
            id: 'isp_mock_2', name: 'Cultural Insurance Services (CISI) Scholar', issuer: 'CISI',
            planType: 'international_student_plan', networkType: 'PPO',
            monthlyPremium: 72, deductible: 100, oopMax: 3000, pcpCopay: 25, specialistCopay: 45,
            benefits: FULL_BENEFITS.map((b, i) => ({ ...b, covered: [false, false, true, false, true, false, false, false][i] })),
            planUrl: 'https://www.culturalinsurance.com', isReal: false, year,
          }
        )
        break
      }

      case 'cobra': {
        cards.push({
          id: 'cobra_mock',
          name: `COBRA continuation${profile.employerName ? ` (${profile.employerName})` : ''}`,
          issuer: profile.employerName ?? 'Former employer',
          planType: 'cobra', networkType: 'PPO',
          monthlyPremium: 650, deductible: 1500, oopMax: 5000, pcpCopay: 25, specialistCopay: 50,
          benefits: FULL_BENEFITS.map((b, i) => ({ ...b, covered: [true, true, true, true, true, false, false, false][i] })),
          isReal: false, year,
          ...(isCurrentForType(profile, 'cobra') ? { isCurrentPlan: true } : {}),
        })
        break
      }

      case 'short_term': {
        cards.push({
          id: 'short_term_mock', name: 'HealthMarkets Short-Term Plan', issuer: 'HealthMarkets',
          planType: 'short_term', networkType: 'PPO',
          monthlyPremium: 85, deductible: 5000, oopMax: 20000, pcpCopay: 50, specialistCopay: 100,
          benefits: FULL_BENEFITS.map(b => ({ ...b, covered: false })),
          isReal: false, year,
          ...(isCurrentForType(profile, 'short_term') ? { isCurrentPlan: true } : {}),
        })
        break
      }

      case 'aca_marketplace': {
        // Only reached when real API fetch failed or no ZIP
        cards.push({
          id: 'aca_mock', name: 'ACA Marketplace Silver Plan (Estimated)', issuer: 'Healthcare.gov',
          planType: 'aca_marketplace', networkType: 'PPO',
          monthlyPremium: 350, deductible: 3000, oopMax: 7000, pcpCopay: 30, specialistCopay: 60,
          benefits: FULL_BENEFITS.map((b, i) => ({ ...b, covered: [false, false, true, true, true, false, false, false][i] })),
          planUrl: 'https://www.healthcare.gov', isReal: false, year,
          ...(isCurrentForType(profile, 'aca_marketplace') ? { isCurrentPlan: true } : {}),
        })
        break
      }
    }
  }

  return cards
}

// ── Score, mark primary recommendation, and sort ─────────────────────────────

function finalizePlans(
  rawCards: Omit<PlanCard, 'fitScore' | 'fitReasons' | 'isPrimaryRecommendation'>[],
  primaryRecommendation: PlanType,
  profile: UserProfile
): PlanCard[] {
  const scored: PlanCard[] = rawCards.map(p => {
    const { score, reasons: baseReasons } = calcFitScore(p as Omit<PlanCard, 'fitScore' | 'fitReasons'>, profile)
    const match = p.planType === 'employer_sponsored' ? matchEmployerPlans(profile.employerName) : null
    const extraReasons: string[] = match
      ? [match.data.notes, match.data.enrollmentTip]
      : (!profile.employerName && p.id === 'employer_mock')
        ? ['Enter your employer name for specific plan options']
        : []
    return { ...p, fitScore: score, fitReasons: [...baseReasons, ...extraReasons].slice(0, 5), isPrimaryRecommendation: false }
  })

  // Employer comparison messaging
  const currentEmpCard = scored.find(p => p.isCurrentPlan && p.planType === 'employer_sponsored')
  if (currentEmpCard && profile.currentEmployerPlan) {
    const bestAlt = scored.find(p => !p.isCurrentPlan && p.planType === 'employer_sponsored')
    if (bestAlt && bestAlt.fitScore > currentEmpCard.fitScore) {
      currentEmpCard.fitReasons = ['Your current plan — a switch may save you money or improve coverage', ...currentEmpCard.fitReasons].slice(0, 5)
      bestAlt.fitReasons = ['Consider switching to this at your next open enrollment', ...bestAlt.fitReasons].slice(0, 5)
    } else {
      currentEmpCard.fitReasons = ["You're on the best plan for your profile — consider keeping it at renewal", ...currentEmpCard.fitReasons].slice(0, 5)
    }
  }

  // Sort: primaryRecommendation type cards first (by fitScore), then others (by fitScore)
  scored.sort((a, b) => {
    const aIsPrim = a.planType === primaryRecommendation
    const bIsPrim = b.planType === primaryRecommendation
    if (aIsPrim && !bIsPrim) return -1
    if (!aIsPrim && bIsPrim) return 1
    return b.fitScore - a.fitScore
  })

  // Mark isPrimaryRecommendation on exactly the first card of the primary type
  let marked = false
  return scored.map(p => {
    if (!marked && p.planType === primaryRecommendation) {
      marked = true
      return { ...p, isPrimaryRecommendation: true }
    }
    return p
  })
}

// ── Main entry point ─────────────────────────────────────────────────────────

export async function getPlansForProfile(
  profile: UserProfile,
  eligiblePlans: PlanType[],
  primaryRecommendation: PlanType
): Promise<PlanCard[]> {
  const allCards: Omit<PlanCard, 'fitScore' | 'fitReasons' | 'isPrimaryRecommendation'>[] = []

  // Fetch real ACA plans if in eligiblePlans and ZIP is available
  if (eligiblePlans.includes('aca_marketplace') && profile.zipCode) {
    const realAca = await fetchACAPlans(profile)
    if (realAca.length > 0) {
      realAca.forEach(p => allCards.push(p))
      const nonAcaTypes = eligiblePlans.filter(t => t !== 'aca_marketplace')
      buildMockedCards(profile, nonAcaTypes).forEach(p => allCards.push(p))
      return finalizePlans(allCards, primaryRecommendation, profile)
    }
  }

  // Fall back to fully mocked cards for all eligible types
  buildMockedCards(profile, eligiblePlans).forEach(p => allCards.push(p))
  return finalizePlans(allCards, primaryRecommendation, profile)
}
