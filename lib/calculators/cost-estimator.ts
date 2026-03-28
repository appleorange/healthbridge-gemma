import type { UserProfile, PlanType, CostEstimate } from '@/types'
import { matchEmployerPlans, KNOWN_EMPLOYER_PLANS } from '@/lib/plans/plan-finder'

// 2026 Federal Poverty Level thresholds
const FPL_BASE: Record<number, number> = {
  1: 15650, 2: 21150, 3: 26650, 4: 32150,
  5: 37650, 6: 43150, 7: 48650, 8: 54150,
}

export function getFPL(income: number, householdSize: number): number {
  const base = FPL_BASE[Math.min(householdSize, 8)] ?? 54150 + (householdSize - 8) * 5500
  return (income / base) * 100
}

// Local type for subsidy calculation result
interface SubsidyResult {
  fplPercentage: number
  qualifiesForPTC: boolean
  estimatedMonthlyCredit: { low: number; high: number }
  qualifiesForCSR: boolean
  csrLevel?: 'silver_94' | 'silver_87' | 'silver_73'
  medicaidEligible: boolean
  chipEligible: boolean
  notes: string[]
}

// ── Subsidy / ACA eligibility calculator ────────────────────────────────────

export function calculateSubsidy(profile: UserProfile): SubsidyResult {
  const fpl = getFPL(profile.annualIncome, profile.householdSize)
  const notes: string[] = []

  const acaEligibleStatuses = ['us_citizen', 'green_card', 'refugee_asylee', 'l1', 'o1', 'tn']
  const isACAEligible = acaEligibleStatuses.includes(profile.immigrationStatus)
  const hasAffordableEmployerPlan = profile.hasEmployerInsurance === true &&
    ['employed_fulltime', 'employed_parttime'].includes(profile.employmentStatus)

  const MEDICAID_EXPANSION_STATES = [
    'AK','AZ','AR','CA','CO','CT','DC','DE','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MO','MT','NE','NV','NH',
    'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SD','UT','VT',
    'VA','WA','WV','WI',
  ]
  const inExpansionState = MEDICAID_EXPANSION_STATES.includes(profile.state)
  const medicaidEligible = isACAEligible && fpl < 138 && inExpansionState

  if (medicaidEligible) {
    notes.push('At your income level you likely qualify for Medicaid — which has $0 premium and minimal cost-sharing. Apply before exploring marketplace plans.')
  }

  const chipEligible = profile.hasDependents && fpl < 200 && isACAEligible
  if (chipEligible) notes.push("Your children may qualify for CHIP — low-cost coverage for kids in families that earn too much for Medicaid.")

  const qualifiesForPTC = isACAEligible && fpl >= 100 && fpl <= 400 && !hasAffordableEmployerPlan && !medicaidEligible

  let requiredContributionPct = 0
  if (fpl < 150) requiredContributionPct = 0
  else if (fpl < 200) requiredContributionPct = 3.0
  else if (fpl < 250) requiredContributionPct = 4.0
  else if (fpl < 300) requiredContributionPct = 6.0
  else requiredContributionPct = 8.5

  const benchmarkPremiumLow = 450
  const benchmarkPremiumHigh = 600
  const requiredContributionMonthly = (profile.annualIncome * requiredContributionPct / 100) / 12
  const creditLow = Math.max(0, Math.round(benchmarkPremiumLow - requiredContributionMonthly))
  const creditHigh = Math.max(0, Math.round(benchmarkPremiumHigh - requiredContributionMonthly))

  const qualifiesForCSR = qualifiesForPTC && fpl <= 250
  let csrLevel: SubsidyResult['csrLevel']
  if (qualifiesForCSR) {
    if (fpl <= 150) csrLevel = 'silver_94'
    else if (fpl <= 200) csrLevel = 'silver_87'
    else csrLevel = 'silver_73'
    notes.push(`At ${Math.round(fpl)}% FPL you qualify for Cost-Sharing Reductions on Silver plans — your deductibles and copays will be significantly lower than a standard Silver plan.`)
  }

  if (qualifiesForPTC && !qualifiesForCSR) {
    notes.push(`At ${Math.round(fpl)}% FPL you qualify for Premium Tax Credits. These reduce your monthly premium — apply the credit when you enroll on Healthcare.gov or your state exchange.`)
  }

  if (!isACAEligible) {
    notes.push('Your immigration status does not qualify for ACA marketplace subsidies. School plans, ISPs, and employer plans are your main options.')
  }

  if (fpl > 400 && isACAEligible) {
    notes.push('Your income exceeds 400% FPL — you do not qualify for Premium Tax Credits, but you can still purchase unsubsidized marketplace plans with strong consumer protections.')
  }

  return {
    fplPercentage: Math.round(fpl),
    qualifiesForPTC,
    estimatedMonthlyCredit: { low: creditLow, high: creditHigh },
    qualifiesForCSR,
    csrLevel,
    medicaidEligible,
    chipEligible,
    notes,
  }
}

// ── Employer cost lookup ─────────────────────────────────────────────────────

const EMPLOYER_COSTS: Record<string, {
  employeeMonthlyPremium: [number, number]
  deductible: [number, number]
  oopMax: [number, number]
  pcpCopay: number
}> = {
  'google':    { employeeMonthlyPremium: [0, 50],   deductible: [250, 1500], oopMax: [1500, 3000], pcpCopay: 20 },
  'amazon':    { employeeMonthlyPremium: [50, 150],  deductible: [500, 2000], oopMax: [2000, 4000], pcpCopay: 25 },
  'microsoft': { employeeMonthlyPremium: [0, 30],   deductible: [200, 1000], oopMax: [1000, 2500], pcpCopay: 15 },
  'meta':      { employeeMonthlyPremium: [0, 0],    deductible: [0, 500],    oopMax: [1000, 2000], pcpCopay: 0  },
  'apple':     { employeeMonthlyPremium: [0, 50],   deductible: [500, 1500], oopMax: [1500, 3000], pcpCopay: 20 },
}

// ── University cost lookup ───────────────────────────────────────────────────

const UNIVERSITY_COSTS: Record<string, {
  monthlyPremium: [number, number]
  deductible: [number, number]
  oopMax: [number, number]
}> = {
  'carnegie mellon':    { monthlyPremium: [180, 200], deductible: [150, 250], oopMax: [2000, 3000] },
  'cmu':                { monthlyPremium: [180, 200], deductible: [150, 250], oopMax: [2000, 3000] },
  'university of pittsburgh': { monthlyPremium: [140, 170], deductible: [200, 300], oopMax: [2500, 3500] },
  'pitt':               { monthlyPremium: [140, 170], deductible: [200, 300], oopMax: [2500, 3500] },
  'nyu':                { monthlyPremium: [220, 260], deductible: [100, 200], oopMax: [2000, 3000] },
  'harvard':            { monthlyPremium: [200, 240], deductible: [100, 200], oopMax: [1500, 2500] },
  'mit':                { monthlyPremium: [190, 220], deductible: [100, 200], oopMax: [1500, 2500] },
  'stanford':           { monthlyPremium: [180, 210], deductible: [100, 200], oopMax: [1500, 2500] },
  'university of michigan': { monthlyPremium: [160, 190], deductible: [200, 300], oopMax: [2000, 3000] },
  'columbia':           { monthlyPremium: [230, 270], deductible: [100, 200], oopMax: [2000, 3000] },
  'ucla':               { monthlyPremium: [150, 180], deductible: [200, 300], oopMax: [2000, 3000] },
  'uc berkeley':        { monthlyPremium: [150, 180], deductible: [200, 300], oopMax: [2000, 3000] },
}

// ── OOP calculator (shared across plan types) ────────────────────────────────

function computeOop(
  profile: UserProfile,
  oopMaxLow: number,
  oopMaxHigh: number,
  visitCopay: number,
  rxCopayMultiplier: number,
): { low: number; high: number } {
  const usageMultiplier = profile.expectedHealthcareUsage === 'minimal' ? 1
    : profile.expectedHealthcareUsage === 'moderate' ? 2.5
    : 5
  const visitCost = usageMultiplier * 4 * visitCopay

  // Rx: each prescription = 30-day supply per month, annualized
  const numRx = profile.numberOfPrescriptions ?? (profile.takesRegularMedications ? 2 : 0)
  const rxCost = numRx * 30 * rxCopayMultiplier * 12

  let oopLow = visitCost + rxCost
  let oopHigh = visitCost * 1.5 + rxCost

  // Hospital frequency
  const hosp = profile.hospitalVisitFrequency
  if (hosp === 'never') {
    oopLow *= 0.6
    oopHigh *= 0.6
  } else if (hosp === 'regularly' || hosp === 'monthly') {
    oopHigh = oopMaxHigh
    oopLow = Math.max(oopLow, oopMaxLow * 0.7)
  }

  // Planned surgery/procedure: fixed $3000–5000 addition
  if (profile.expectsSurgeryOrProcedure) {
    oopLow += 3000
    oopHigh += 5000
  }

  // Chronic condition: diabetes-specific costs
  if (profile.hasChronicConditions &&
      Array.isArray(profile.specificHealthConcerns) &&
      profile.specificHealthConcerns.includes('diabetes')) {
    oopLow += 2000
    oopHigh += 4000
  }

  return {
    low: Math.round(Math.min(Math.max(0, oopLow), oopMaxLow)),
    high: Math.round(Math.min(Math.max(0, oopHigh), oopMaxHigh)),
  }
}

function oopAssumptions(profile: UserProfile): string[] {
  const notes: string[] = [`Based on ${profile.expectedHealthcareUsage ?? 'moderate'} healthcare usage`]
  if (profile.takesRegularMedications) {
    notes.push(`Includes ${profile.numberOfPrescriptions ?? 1} Rx at 30-day supply pricing`)
  }
  if (profile.expectsSurgeryOrProcedure) notes.push('Includes $3,000–5,000 for planned procedure')
  if (profile.hasChronicConditions &&
      Array.isArray(profile.specificHealthConcerns) &&
      profile.specificHealthConcerns.includes('diabetes')) {
    notes.push('Includes $2,000–4,000 for diabetes management costs')
  }
  return notes
}

// ── Employer plan estimate builder ───────────────────────────────────────────

function buildEmployerEstimates(profile: UserProfile, subsidy: SubsidyResult): CostEstimate[] {
  const employerMatch = matchEmployerPlans(profile.employerName)
  const empCosts = employerMatch ? EMPLOYER_COSTS[employerMatch.key] : null

  // Default ranges when no known employer match
  const DEFAULT_EMP: typeof EMPLOYER_COSTS[string] = {
    employeeMonthlyPremium: [80, 400],
    deductible: [500, 3000],
    oopMax: [1500, 6000],
    pcpCopay: 25,
  }
  const base = empCosts ?? DEFAULT_EMP

  // When we know the specific plans AND the user has told us their current plan,
  // generate one entry per named plan with narrowed costs
  if (employerMatch && profile.currentEmployerPlan) {
    const planNames = KNOWN_EMPLOYER_PLANS[employerMatch.key]?.plans ?? []
    const currentInput = profile.currentEmployerPlan.toLowerCase().trim()

    return planNames.map(planName => {
      const nameUpper = planName.toUpperCase()
      const isHDHP = nameUpper.includes('HDHP') || nameUpper.includes('HSA')
      const isHMO = nameUpper.includes('HMO')

      // Adjust costs based on plan type within the employer's range
      let [premLow, premHigh] = base.employeeMonthlyPremium
      let [dedLow, dedHigh] = base.deductible
      let [oopLow, oopHigh] = base.oopMax
      let { pcpCopay } = base

      if (isHDHP) {
        premLow = Math.max(0, premLow - 20)
        premHigh = Math.min(premHigh, 30)
        dedLow = Math.max(dedLow, 1500)
        dedHigh = Math.max(dedHigh, 3000)
        pcpCopay = 0 // HDHP: no copay until deductible met
      } else if (isHMO) {
        dedHigh = Math.min(dedHigh, 1000)
        pcpCopay = Math.max(pcpCopay - 5, 10)
      }
      // PPO: use base range as-is

      const oop = computeOop(profile, oopLow, oopHigh, pcpCopay || 25, 0.2)
      const annualPremLow = premLow * 12
      const annualPremHigh = premHigh * 12

      const isCurrent = planName.toLowerCase().includes(currentInput) ||
        currentInput.includes(planName.toLowerCase())

      const assumptions = oopAssumptions(profile)
      if (isHDHP) {
        assumptions.push(`HDHP includes HSA — ${profile.employerName} contributes $500/year to your HSA`)
      }

      return {
        planType: 'employer_sponsored' as PlanType,
        planLabel: `${profile.employerName} — ${planName}`,
        isCurrentPlan: isCurrent,
        estimatedMonthlyPremium: { low: premLow, high: premHigh },
        estimatedAnnualOutOfPocket: oop,
        estimatedAnnualTotal: {
          low: Math.round(annualPremLow + oop.low),
          high: Math.round(annualPremHigh + oop.high),
        },
        subsidyApplied: 0,
        assumptions,
        bestFor: isHDHP ? 'Healthy employees who want HSA tax advantages'
          : isHMO ? 'Lower deductible and copays within network'
          : 'Flexibility to see any in-network specialist',
      }
    })
  }

  // Single generic estimate (no known employer OR currentEmployerPlan not set)
  const oop = computeOop(profile, base.oopMax[0], base.oopMax[1], base.pcpCopay, 0.2)
  const annualPremLow = base.employeeMonthlyPremium[0] * 12
  const annualPremHigh = base.employeeMonthlyPremium[1] * 12
  const label = empCosts && profile.employerName
    ? `${profile.employerName} employer plan`
    : 'Employer-sponsored plan'

  return [{
    planType: 'employer_sponsored',
    planLabel: label,
    estimatedMonthlyPremium: { low: base.employeeMonthlyPremium[0], high: base.employeeMonthlyPremium[1] },
    estimatedAnnualOutOfPocket: oop,
    estimatedAnnualTotal: {
      low: Math.round(annualPremLow + oop.low),
      high: Math.round(annualPremHigh + oop.high),
    },
    subsidyApplied: 0,
    assumptions: [
      ...oopAssumptions(profile),
      empCosts ? `Based on typical ${profile.employerName} benefits data` : 'Best value when employer pays 50–80% of premium',
    ],
    bestFor: 'Best value when employer pays 50–80% of premium',
  }]
}

// ── Main cost estimator ──────────────────────────────────────────────────────

export function estimateCosts(profile: UserProfile, eligiblePlans: PlanType[]): CostEstimate[] {
  const subsidy = calculateSubsidy(profile)
  const fpl = getFPL(profile.annualIncome, profile.householdSize)
  const estimates: CostEstimate[] = []

  for (const plan of eligiblePlans) {
    // ── Employer: potentially expand to per-plan entries ──
    if (plan === 'employer_sponsored') {
      estimates.push(...buildEmployerEstimates(profile, subsidy))
      continue
    }

    // ── ACA Marketplace: FPL-based premium + usage-based metal tier ──
    if (plan === 'aca_marketplace') {
      let premLow: number, premHigh: number
      if (fpl < 200)      { premLow = 0;   premHigh = 50  }
      else if (fpl < 300) { premLow = 50;  premHigh = 200 }
      else if (fpl < 400) { premLow = 150; premHigh = 350 }
      else                { premLow = 300; premHigh = 600 }

      let dedLow: number, dedHigh: number, oopMaxLow: number, oopMaxHigh: number
      const usage = profile.expectedHealthcareUsage
      if (usage === 'minimal') {
        // Bronze tier
        dedLow = 6000; dedHigh = 7000; oopMaxLow = 8000; oopMaxHigh = 9000
      } else if (usage === 'high') {
        // Gold tier
        dedLow = 500; dedHigh = 1500; oopMaxLow = 2000; oopMaxHigh = 4000
      } else {
        // Silver tier (default)
        dedLow = 1500; dedHigh = 3000; oopMaxLow = 4000; oopMaxHigh = 6000
      }

      let annualPremLow = premLow * 12
      let annualPremHigh = premHigh * 12
      let subsidyApplied = 0

      if (subsidy.qualifiesForPTC) {
        const creditAnnualLow = subsidy.estimatedMonthlyCredit.low * 12
        const creditAnnualHigh = subsidy.estimatedMonthlyCredit.high * 12
        annualPremLow = Math.max(0, annualPremLow - creditAnnualHigh)
        annualPremHigh = Math.max(0, annualPremHigh - creditAnnualLow)
        subsidyApplied = Math.round((creditAnnualLow + creditAnnualHigh) / 2)
      }

      const oop = computeOop(profile, oopMaxLow, oopMaxHigh, 30, 0.3)

      // CSR bonus: reduce OOP on Silver plans
      let coop = oop
      if (subsidy.qualifiesForCSR && usage !== 'minimal' && usage !== 'high') {
        const discount = subsidy.csrLevel === 'silver_94' ? 0.3
          : subsidy.csrLevel === 'silver_87' ? 0.5 : 0.7
        coop = { low: Math.round(oop.low * discount), high: Math.round(oop.high * discount) }
      }

      const metalTier = usage === 'minimal' ? 'Bronze' : usage === 'high' ? 'Gold' : 'Silver'
      const assumptions = oopAssumptions(profile)
      if (subsidyApplied > 0) assumptions.push(`Premium Tax Credit of ~$${subsidyApplied}/year applied`)
      if (subsidy.qualifiesForCSR) assumptions.push(`Cost-Sharing Reduction applied (${metalTier} plan)`)
      assumptions.push(`Estimated ${metalTier} plan based on your usage level`)

      estimates.push({
        planType: 'aca_marketplace',
        planLabel: `ACA Marketplace (${metalTier})`,
        estimatedMonthlyPremium: {
          low: Math.round(annualPremLow / 12),
          high: Math.round(annualPremHigh / 12),
        },
        estimatedAnnualOutOfPocket: coop,
        estimatedAnnualTotal: {
          low: Math.round(annualPremLow + coop.low),
          high: Math.round(annualPremHigh + coop.high),
        },
        subsidyApplied,
        assumptions,
        bestFor: usage === 'high' ? 'Gold/Platinum tier for frequent care'
          : usage === 'minimal' ? 'Bronze tier for low usage — pay less monthly, more when you need care'
          : 'Silver tier for occasional care — balanced premium and cost-sharing',
      })
      continue
    }

    // ── School plan: university-specific or generic ──
    if (plan === 'school_plan') {
      const uniLower = profile.university?.toLowerCase() ?? ''
      const uniKey = Object.keys(UNIVERSITY_COSTS).find(k => uniLower.includes(k))
      const uniCosts = uniKey ? UNIVERSITY_COSTS[uniKey] : null

      const premLow = uniCosts ? uniCosts.monthlyPremium[0] : 100
      const premHigh = uniCosts ? uniCosts.monthlyPremium[1] : 292
      const dedLow = uniCosts ? uniCosts.deductible[0] : 100
      const dedHigh = uniCosts ? uniCosts.deductible[1] : 500
      const oopMaxLow = uniCosts ? uniCosts.oopMax[0] : 1000
      const oopMaxHigh = uniCosts ? uniCosts.oopMax[1] : 3000

      const oop = computeOop(profile, oopMaxLow, oopMaxHigh, 20, 0.2)
      const annualPremLow = premLow * 12
      const annualPremHigh = premHigh * 12
      const label = uniKey && profile.university
        ? `${profile.university} health plan (SHIP)`
        : 'University health plan (SHIP)'

      const assumptions = oopAssumptions(profile)
      if (uniCosts && profile.university) {
        assumptions.push(`Specific plan data for ${profile.university}`)
      }

      estimates.push({
        planType: 'school_plan',
        planLabel: label,
        estimatedMonthlyPremium: { low: premLow, high: premHigh },
        estimatedAnnualOutOfPocket: oop,
        estimatedAnnualTotal: {
          low: Math.round(annualPremLow + oop.low),
          high: Math.round(annualPremHigh + oop.high),
        },
        subsidyApplied: 0,
        assumptions,
        bestFor: 'Students at schools with comprehensive SHIP plans',
      })
      continue
    }

    // ── All other plan types: generic config table ──
    // ── Parent plan: use collected plan details ──
    if (plan === 'parent_plan') {
      const premMap: Record<string, number> = { '0': 0, 'under_100': 50, '100_to_300': 200, 'over_300': 350, 'unknown': 100 }
      const dedMap: Record<string, [number, number]> = {
        'under_500': [0, 500], '500_to_1500': [500, 1500],
        '1500_to_3000': [1500, 3000], 'over_3000': [3000, 6000], 'unknown': [500, 3000],
      }
      const monthlyPrem = premMap[profile.parentPlanPremiumContribution ?? 'unknown'] ?? 100
      const [oopLow, oopHigh] = dedMap[profile.parentPlanDeductible ?? 'unknown'] ?? [500, 3000]
      const visitCopay = profile.parentPlanType === 'hmo' ? 20 : profile.parentPlanType === 'ppo' ? 25 : 30
      const oop = computeOop(profile, oopLow, oopHigh, visitCopay, 0.25)
      const annualPrem = monthlyPrem * 12
      const insurer = profile.parentPlanInsurer ?? "Parent/spouse's plan"
      const typeLabel = profile.parentPlanType && profile.parentPlanType !== 'unknown'
        ? ` (${profile.parentPlanType.toUpperCase()})`
        : ''
      estimates.push({
        planType: 'parent_plan',
        planLabel: `${insurer}${typeLabel}`,
        estimatedMonthlyPremium: { low: monthlyPrem, high: monthlyPrem },
        estimatedAnnualOutOfPocket: oop,
        estimatedAnnualTotal: {
          low: Math.round(annualPrem + oop.low),
          high: Math.round(annualPrem + oop.high),
        },
        subsidyApplied: 0,
        assumptions: [
          ...oopAssumptions(profile),
          monthlyPrem === 0
            ? 'Your portion of the premium is $0 — fully covered by the plan holder\'s employer'
            : `Your monthly contribution: $${monthlyPrem}/mo`,
          `Deductible range: $${oopLow.toLocaleString()}–$${oopHigh.toLocaleString()}`,
        ],
        bestFor: 'Current coverage — compare against alternatives before switching',
      })
      continue
    }

    const genericConfigs: Partial<Record<PlanType, {
      premiumLow: number; premiumHigh: number
      oopMaxLow: number; oopMaxHigh: number
      visitCopay: number; rxCopayMultiplier: number
      label: string; bestFor: string
    }>> = {
      medicaid: {
        premiumLow: 0, premiumHigh: 20,
        oopMaxLow: 0, oopMaxHigh: 500,
        visitCopay: 3, rxCopayMultiplier: 0.05,
        label: 'Medicaid',
        bestFor: 'Anyone who qualifies — lowest total cost by far',
      },
      international_student_plan: {
        premiumLow: 58, premiumHigh: 167,
        oopMaxLow: 1500, oopMaxHigh: 5000,
        visitCopay: 30, rxCopayMultiplier: 0.3,
        label: 'International student plan (ISP)',
        bestFor: 'Students who can satisfy their school waiver requirement',
      },
      cobra: {
        premiumLow: 500, premiumHigh: 1800,
        oopMaxLow: 2000, oopMaxHigh: 7000,
        visitCopay: 30, rxCopayMultiplier: 0.25,
        label: 'COBRA continuation',
        bestFor: 'Short-term bridge if your doctors are in the existing network',
      },
      short_term: {
        premiumLow: 50, premiumHigh: 200,
        oopMaxLow: 5000, oopMaxHigh: 25000,
        visitCopay: 50, rxCopayMultiplier: 1.0,
        label: 'Short-term health plan',
        bestFor: 'Last resort only — gaps in coverage are significant',
      },
    }

    const cfg = genericConfigs[plan]
    if (!cfg) continue

    const annualPremLow = cfg.premiumLow * 12
    const annualPremHigh = cfg.premiumHigh * 12
    const oop = computeOop(profile, cfg.oopMaxLow, cfg.oopMaxHigh, cfg.visitCopay, cfg.rxCopayMultiplier)

    estimates.push({
      planType: plan,
      planLabel: cfg.label,
      estimatedMonthlyPremium: { low: cfg.premiumLow, high: cfg.premiumHigh },
      estimatedAnnualOutOfPocket: oop,
      estimatedAnnualTotal: {
        low: Math.round(annualPremLow + oop.low),
        high: Math.round(annualPremHigh + oop.high),
      },
      subsidyApplied: 0,
      assumptions: oopAssumptions(profile),
      bestFor: cfg.bestFor,
    })
  }

  return estimates.sort((a, b) => a.estimatedAnnualTotal.low - b.estimatedAnnualTotal.low)
}
