import type { UserProfile, PlanType, CostEstimate, SubsidyCalculation } from '@/types'

// 2024 Federal Poverty Level thresholds
const FPL_BASE: Record<number, number> = {
  1: 15060, 2: 20440, 3: 25820, 4: 31200,
  5: 36580, 6: 41960, 7: 47340, 8: 52720,
}

export function getFPL(income: number, householdSize: number): number {
  const base = FPL_BASE[Math.min(householdSize, 8)] ?? 52720 + (householdSize - 8) * 5380
  return (income / base) * 100
}

// ── Subsidy / ACA eligibility calculator ────────────────────────────────────

export function calculateSubsidy(profile: UserProfile): SubsidyCalculation {
  const fpl = getFPL(profile.annualIncome, profile.householdSize)
  const notes: string[] = []

  const acaEligibleStatuses = ['us_citizen', 'green_card', 'refugee_asylee', 'l1', 'o1', 'tn']
  const isACAEligible = acaEligibleStatuses.includes(profile.immigrationStatus)
  const hasAffordableEmployerPlan = profile.hasEmployerInsurance &&
    ['employed_fulltime', 'employed_parttime'].includes(profile.employmentStatus)

  // Medicaid check (roughly <138% FPL in expansion states)
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

  // CHIP check
  const chipEligible = profile.hasDependents && fpl < 200 && isACAEligible
  if (chipEligible) notes.push("Your children may qualify for CHIP — low-cost coverage for kids in families that earn too much for Medicaid.")

  // PTC (Premium Tax Credit) eligibility: 100–400% FPL, no affordable employer coverage
  const qualifiesForPTC = isACAEligible && fpl >= 100 && fpl <= 400 && !hasAffordableEmployerPlan && !medicaidEligible

  // Estimate monthly PTC credit using benchmark methodology
  // Required contribution % by FPL band (2024 tables, simplified)
  let requiredContributionPct = 0
  if (fpl < 133) requiredContributionPct = 0
  else if (fpl < 150) requiredContributionPct = 0
  else if (fpl < 200) requiredContributionPct = 3.0
  else if (fpl < 250) requiredContributionPct = 4.0
  else if (fpl < 300) requiredContributionPct = 6.0
  else if (fpl < 400) requiredContributionPct = 8.5
  else requiredContributionPct = 8.5

  // Benchmark Silver plan national average premium (2024 single): ~$450–$600/month
  const benchmarkPremiumLow = 450
  const benchmarkPremiumHigh = 600
  const requiredContributionMonthly = (profile.annualIncome * requiredContributionPct / 100) / 12
  const creditLow = Math.max(0, Math.round(benchmarkPremiumLow - requiredContributionMonthly))
  const creditHigh = Math.max(0, Math.round(benchmarkPremiumHigh - requiredContributionMonthly))

  // CSR (Cost-Sharing Reduction) — available at 100–250% FPL on Silver plans
  const qualifiesForCSR = qualifiesForPTC && fpl <= 250
  let csrLevel: SubsidyCalculation['csrLevel']
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

// ── Cost estimator ───────────────────────────────────────────────────────────

// Annual usage estimates based on profile
function getUsageMultiplier(profile: UserProfile): { visits: number; rxCost: number; procedureCost: number } {
  const base = profile.expectedHealthcareUsage === 'minimal' ? 1
    : profile.expectedHealthcareUsage === 'moderate' ? 2.5
    : 5

  const rxPerScript = 120 * (profile.numberOfPrescriptions ?? (profile.takesRegularMedications ? 2 : 0))
  const procedureCost = profile.expectsSurgeryOrProcedure ? 8000 : 0
  const chronicExtra = profile.hasChronicConditions ? 2000 : 0

  return {
    visits: base,
    rxCost: rxPerScript + chronicExtra,
    procedureCost,
  }
}

export function estimateCosts(profile: UserProfile, eligiblePlans: PlanType[]): CostEstimate[] {
  const usage = getUsageMultiplier(profile)
  const subsidy = calculateSubsidy(profile)
  const estimates: CostEstimate[] = []

  const planConfigs: Partial<Record<PlanType, {
    premiumLow: number; premiumHigh: number
    deductibleLow: number; deductibleHigh: number
    oopMaxLow: number; oopMaxHigh: number
    visitCopay: number; rxCopayMultiplier: number
    bestFor: string
  }>> = {
    medicaid: {
      premiumLow: 0, premiumHigh: 20,
      deductibleLow: 0, deductibleHigh: 0,
      oopMaxLow: 0, oopMaxHigh: 500,
      visitCopay: 3, rxCopayMultiplier: 0.05,
      bestFor: 'Anyone who qualifies — lowest total cost by far',
    },
    aca_marketplace: {
      premiumLow: 150, premiumHigh: 600,
      deductibleLow: 500, deductibleHigh: 7000,
      oopMaxLow: 2000, oopMaxHigh: 9450,
      visitCopay: 30, rxCopayMultiplier: 0.3,
      bestFor: profile.expectedHealthcareUsage === 'high' ? 'Gold/Platinum tier for frequent care' : 'Bronze/Silver tier for occasional care',
    },
    employer_sponsored: {
      premiumLow: 80, premiumHigh: 400,
      deductibleLow: 500, deductibleHigh: 3000,
      oopMaxLow: 1500, oopMaxHigh: 6000,
      visitCopay: 25, rxCopayMultiplier: 0.2,
      bestFor: 'Best value when employer pays 50–80% of premium',
    },
    school_plan: {
      premiumLow: 1200, premiumHigh: 3500,
      deductibleLow: 100, deductibleHigh: 500,
      oopMaxLow: 1000, oopMaxHigh: 3000,
      visitCopay: 20, rxCopayMultiplier: 0.2,
      bestFor: 'Students at schools with comprehensive SHIP plans',
    },
    international_student_plan: {
      premiumLow: 700, premiumHigh: 2000,
      deductibleLow: 250, deductibleHigh: 1000,
      oopMaxLow: 1500, oopMaxHigh: 5000,
      visitCopay: 30, rxCopayMultiplier: 0.3,
      bestFor: 'Students who can satisfy their school waiver requirement',
    },
    cobra: {
      premiumLow: 500, premiumHigh: 1800,
      deductibleLow: 500, deductibleHigh: 3000,
      oopMaxLow: 2000, oopMaxHigh: 7000,
      visitCopay: 30, rxCopayMultiplier: 0.25,
      bestFor: 'Short-term bridge if your doctors are in the existing network',
    },
    short_term: {
      premiumLow: 50, premiumHigh: 200,
      deductibleLow: 2000, deductibleHigh: 10000,
      oopMaxLow: 5000, oopMaxHigh: 25000,
      visitCopay: 50, rxCopayMultiplier: 1.0,
      bestFor: 'Last resort only — gaps in coverage are significant',
    },
  }

  const planLabels: Partial<Record<PlanType, string>> = {
    medicaid: 'Medicaid',
    aca_marketplace: 'ACA Marketplace',
    employer_sponsored: 'Employer-sponsored plan',
    school_plan: 'University health plan (SHIP)',
    international_student_plan: 'International student plan (ISP)',
    cobra: 'COBRA continuation',
    short_term: 'Short-term health plan',
  }

  for (const plan of eligiblePlans) {
    const cfg = planConfigs[plan]
    if (!cfg) continue

    // Annual premium (before subsidy)
    let annualPremiumLow = cfg.premiumLow * 12
    let annualPremiumHigh = cfg.premiumHigh * 12
    let subsidyApplied = 0

    // Apply PTC subsidy to ACA marketplace plans
    if (plan === 'aca_marketplace' && subsidy.qualifiesForPTC) {
      const annualCreditLow = subsidy.estimatedMonthlyCredit.low * 12
      const annualCreditHigh = subsidy.estimatedMonthlyCredit.high * 12
      annualPremiumLow = Math.max(0, annualPremiumLow - annualCreditHigh)
      annualPremiumHigh = Math.max(0, annualPremiumHigh - annualCreditLow)
      subsidyApplied = Math.round((annualCreditLow + annualCreditHigh) / 2)
    }

    // Estimate annual out-of-pocket (visits + rx + procedures, capped at OOP max)
    const visitCost = usage.visits * 4 * cfg.visitCopay // ~4 visits per "unit"
    const rxCost = usage.rxCost * cfg.rxCopayMultiplier
    let oopLow = Math.min(visitCost + rxCost + (usage.procedureCost * 0.1), cfg.oopMaxLow)
    let oopHigh = Math.min(visitCost * 1.5 + rxCost + usage.procedureCost, cfg.oopMaxHigh)

    // CSR bonus: lower OOP on Silver ACA plans
    if (plan === 'aca_marketplace' && subsidy.qualifiesForCSR) {
      const csrDiscount = subsidy.csrLevel === 'silver_94' ? 0.3
        : subsidy.csrLevel === 'silver_87' ? 0.5 : 0.7
      oopLow = Math.round(oopLow * csrDiscount)
      oopHigh = Math.round(oopHigh * csrDiscount)
    }

    const assumptions: string[] = [
      `Based on ${profile.expectedHealthcareUsage ?? 'moderate'} healthcare usage`,
    ]
    if (profile.takesRegularMedications) assumptions.push(`Includes ~${profile.numberOfPrescriptions ?? 1} Rx at this plan's formulary tier`)
    if (profile.expectsSurgeryOrProcedure) assumptions.push('Includes estimate for planned procedure')
    if (subsidyApplied > 0) assumptions.push(`Premium Tax Credit of ~$${subsidyApplied}/year applied`)
    if (subsidy.qualifiesForCSR && plan === 'aca_marketplace') assumptions.push('Cost-Sharing Reduction applied (Silver plan)')

    estimates.push({
      planType: plan,
      planLabel: planLabels[plan] ?? plan,
      estimatedMonthlyPremium: {
        low: Math.round(annualPremiumLow / 12),
        high: Math.round(annualPremiumHigh / 12),
      },
      estimatedAnnualOutOfPocket: {
        low: Math.round(oopLow),
        high: Math.round(oopHigh),
      },
      estimatedAnnualTotal: {
        low: Math.round(annualPremiumLow + oopLow),
        high: Math.round(annualPremiumHigh + oopHigh),
      },
      subsidyApplied,
      assumptions,
      bestFor: cfg.bestFor,
    })
  }

  // Sort by estimated annual total (low end)
  return estimates.sort((a, b) => a.estimatedAnnualTotal.low - b.estimatedAnnualTotal.low)
}
