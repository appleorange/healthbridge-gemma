import type { UserProfile, EligibilityResult, PlanType, FlowchartNode, FlowchartEdge, NextStep } from '@/types'
import { estimateCosts } from '@/lib/calculators/cost-estimator'

// States that have expanded Medicaid to cover specific immigrant groups
const MEDICAID_EXPANSION_STATES = [
  'CA', 'CO', 'CT', 'DC', 'IL', 'MA', 'MD', 'ME', 'MN', 'NJ', 'NY', 'OR', 'VT', 'WA'
]

const DACA_MEDICAID_STATES = ['CA', 'CO', 'IL', 'OR', 'WA', 'NY', 'CT', 'DC', 'MA', 'MD', 'MN']

const ACA_EXPANSION_STATES = [
  'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'DE', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SD', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI'
]

// Federal poverty level thresholds (2024)
function getFPLPercentage(annualIncome: number, householdSize: number): number {
  const fplBase: Record<number, number> = {
    1: 15060, 2: 20440, 3: 25820, 4: 31200,
    5: 36580, 6: 41960, 7: 47340, 8: 52720
  }
  const fpl = fplBase[Math.min(householdSize, 8)] || 52720 + (householdSize - 8) * 5380
  return (annualIncome / fpl) * 100
}

function buildBestOptionReasoning(
  primary: PlanType,
  profile: UserProfile,
  fplPct: number,
  eligible: PlanType[]
): string {
  const parts: string[] = []

  switch (primary) {
    case 'medicaid':
      parts.push('Medicaid is your strongest option — it\'s free or nearly free government coverage with comprehensive benefits.')
      if (profile.expectedHealthcareUsage === 'high') {
        parts.push('Given your higher expected healthcare needs, Medicaid\'s low cost-sharing means you won\'t face large out-of-pocket bills.')
      }
      if (profile.takesRegularMedications) {
        parts.push('Medicaid covers prescriptions through its formulary, which is important given your regular medications.')
      }
      parts.push(`At approximately ${Math.round(fplPct)}% of the federal poverty level, you meet the income threshold for your state.`)
      break

    case 'employer_sponsored':
      parts.push('Employer-sponsored insurance is your best choice — employers typically cover 50–80% of your premium, making it the most cost-effective option available.')
      if (profile.expectedHealthcareUsage === 'high' || profile.takesRegularMedications) {
        parts.push('With your expected healthcare needs, the comprehensive coverage and predictable costs of employer plans are especially valuable.')
      }
      parts.push('Enroll during your employer\'s open enrollment window or within 30 days of your hire date.')
      break

    case 'aca_marketplace':
      if (fplPct >= 100 && fplPct <= 400 && !profile.hasEmployerInsurance) {
        parts.push(`At ${Math.round(fplPct)}% of the federal poverty level, you qualify for Premium Tax Credits that significantly reduce your monthly premium.`)
        parts.push('The ACA marketplace offers comprehensive, ACA-compliant plans with guaranteed coverage regardless of pre-existing conditions.')
      } else {
        parts.push('The ACA marketplace gives you access to comprehensive, regulated plans with strong consumer protections.')
      }
      if (profile.takesRegularMedications) {
        parts.push('You can filter marketplace plans by formulary to ensure your medications are covered at an affordable tier.')
      }
      if (profile.expectedHealthcareUsage === 'minimal') {
        parts.push('Consider a Bronze or Catastrophic plan for a lower premium, since you don\'t expect heavy usage.')
      } else if (profile.expectedHealthcareUsage === 'high') {
        parts.push('A Gold or Platinum plan will cost more per month but significantly lower your out-of-pocket costs for frequent care.')
      }
      break

    case 'school_plan':
      parts.push('Your university health plan (SHIP) is your most accessible and practical option as a student.')
      if (profile.yearsLeftInCollege === 'less_than_1') {
        parts.push('Even with less than a year left, it\'s the easiest to enroll in and likely meets any school insurance requirement.')
      } else if (profile.yearsLeftInCollege === '4_plus' || profile.yearsLeftInCollege === '2_to_4') {
        parts.push('With multiple years left, enrolling in your school plan provides stable, continuous coverage throughout your studies — no annual re-enrollment hassle.')
      }
      if (eligible.includes('international_student_plan')) {
        parts.push('Compare it against International Student Plans (ISPs) — ISPs are sometimes cheaper and can satisfy your school\'s waiver requirement.')
      }
      break

    case 'international_student_plan':
      parts.push('An International Student Plan (ISP) offers coverage designed for international students, often at a lower cost than your university\'s SHIP.')
      parts.push('Carefully verify that the ISP meets your school\'s waiver requirements before enrolling — plans vary widely in network and coverage levels.')
      break

    case 'cobra':
      parts.push('COBRA lets you keep your current employer\'s coverage after leaving your job — same plan, same network, same providers.')
      parts.push('The downside: you pay the full premium (no employer subsidy), which can be expensive. You have 60 days from your coverage end date to elect it.')
      if (eligible.includes('aca_marketplace')) {
        parts.push('Job loss is a qualifying life event — compare COBRA costs against ACA marketplace plans, which may be cheaper especially with subsidy eligibility.')
      }
      break

    case 'short_term':
      parts.push('Short-term plans are the most accessible option given your situation, but have serious limitations: no coverage for pre-existing conditions, no mental health, no maternity coverage.')
      parts.push('Treat this as a temporary bridge only. Continue looking for a more comprehensive option — gaps in coverage add up quickly if you need care.')
      break

    default:
      parts.push('Based on your profile, review the available options carefully and consider speaking with a navigator for personalized guidance.')
  }

  return parts.join(' ')
}

export function calculateEligibility(profile: UserProfile): EligibilityResult {
  const eligible: PlanType[] = []
  const ineligible: PlanType[] = []
  const circumstances: string[] = []
  const nextSteps: NextStep[] = []
  const nodes: FlowchartNode[] = []
  const edges: FlowchartEdge[] = []
  const fplPct = getFPLPercentage(profile.annualIncome, profile.householdSize)

  // Build flowchart as we evaluate
  nodes.push({
    id: 'start',
    label: 'Immigration status',
    subtitle: formatStatus(profile.immigrationStatus),
    type: 'question',
    status: 'active',
    explanation: 'Your immigration status is the primary determinant of which health insurance options are available to you in the United States.',
  })

  // --- ACA / Marketplace eligibility ---
  const acaEligibleStatuses = ['us_citizen', 'green_card', 'refugee_asylee', 'l1', 'o1', 'tn']
  const acaEligible = acaEligibleStatuses.includes(profile.immigrationStatus)

  nodes.push({
    id: 'aca_check',
    label: 'ACA marketplace eligible?',
    subtitle: 'Requires lawful presence',
    type: 'question',
    status: acaEligible ? 'eligible' : 'ineligible',
    explanation: 'The ACA marketplace requires "lawful presence" status. This includes citizens, green card holders, refugees, asylees, and certain other visa categories. F-1, J-1, H-1B, and undocumented individuals are generally excluded from marketplace subsidies.',
    legalBasis: '45 CFR § 155.305; ACA Section 1312(f)(3)',
  })
  edges.push({ from: 'start', to: 'aca_check', label: 'Determines' })

  if (acaEligible) {
    eligible.push('aca_marketplace')
    nodes.push({
      id: 'aca_result',
      label: 'ACA marketplace',
      subtitle: 'Healthcare.gov or state exchange',
      type: 'result',
      status: 'eligible',
      explanation: 'You can purchase a plan on the ACA marketplace. Open enrollment runs Nov 1 – Jan 15. You may also qualify for a Premium Tax Credit based on your income.',
    })
    edges.push({ from: 'aca_check', to: 'aca_result', label: 'Yes' })

    // Subsidy check
    const subsidyEligible = fplPct >= 100 && fplPct <= 400 && !profile.hasEmployerInsurance
    if (subsidyEligible) {
      circumstances.push(`You may qualify for a Premium Tax Credit — your income is approximately ${Math.round(fplPct)}% of the federal poverty level.`)
      nodes.push({
        id: 'subsidy',
        label: 'Subsidy eligible',
        subtitle: `~${Math.round(fplPct)}% FPL`,
        type: 'result',
        status: 'eligible',
        explanation: 'Premium Tax Credits reduce your monthly premium. The amount depends on your income relative to the federal poverty level and the cost of the benchmark Silver plan in your area.',
        legalBasis: 'ACA Section 1401; 26 USC § 36B',
      })
      edges.push({ from: 'aca_result', to: 'subsidy', label: 'Income check' })
    }
  } else {
    ineligible.push('aca_marketplace')
    nodes.push({
      id: 'aca_result',
      label: 'ACA marketplace',
      subtitle: 'Not eligible',
      type: 'result',
      status: 'ineligible',
      explanation: 'Your visa status does not meet the "lawfully present" requirement under 45 CFR § 155.305. Non-immigrant visa holders (F-1, J-1, H-1B) and undocumented individuals cannot receive marketplace subsidies.',
      legalBasis: '45 CFR § 155.305(a); ACA Section 1312(f)(3)',
    })
    edges.push({ from: 'aca_check', to: 'aca_result', label: 'No' })
  }

  // --- Medicaid eligibility ---
  const medicaidEligibleStatuses = ['us_citizen', 'refugee_asylee']
  const medicaidLPR = profile.immigrationStatus === 'green_card'
  const medicaidDACA = profile.immigrationStatus === 'daca' && DACA_MEDICAID_STATES.includes(profile.state)
  const medicaidImmigrant = MEDICAID_EXPANSION_STATES.includes(profile.state) &&
    ['green_card'].includes(profile.immigrationStatus)
  const medicaidIncomePct = fplPct
  const medicaidIncomeEligible = ACA_EXPANSION_STATES.includes(profile.state)
    ? medicaidIncomePct <= 138
    : medicaidIncomePct <= 100

  const medicaidEligible = (
    medicaidEligibleStatuses.includes(profile.immigrationStatus) ||
    medicaidLPR ||
    medicaidDACA ||
    medicaidImmigrant
  ) && medicaidIncomeEligible

  nodes.push({
    id: 'medicaid_check',
    label: 'Medicaid eligible?',
    subtitle: 'Income + status based',
    type: 'question',
    status: medicaidEligible ? 'eligible' : 'ineligible',
    explanation: 'Medicaid eligibility depends on both your immigration status and your income. Most non-immigrant visa holders (F-1, H-1B, J-1) are ineligible. Green card holders face a 5-year waiting period in most states.',
    legalBasis: '8 USC § 1611; 8 USC § 1612; Social Security Act § 1903(v)',
  })
  edges.push({ from: 'start', to: 'medicaid_check' })

  if (medicaidEligible) {
    eligible.push('medicaid')
    nodes.push({
      id: 'medicaid_result',
      label: 'Medicaid',
      subtitle: 'Free or low-cost coverage',
      type: 'result',
      status: 'eligible',
      explanation: 'You appear eligible for Medicaid. Apply through your state\'s Medicaid agency or Healthcare.gov. Coverage can start as soon as the month you apply.',
    })
    edges.push({ from: 'medicaid_check', to: 'medicaid_result', label: 'Eligible' })
  } else {
    ineligible.push('medicaid')
  }

  // --- Employer-sponsored ---
  if (profile.hasEmployerInsurance) {
    eligible.push('employer_sponsored')
    nodes.push({
      id: 'employer',
      label: 'Employer-sponsored plan',
      subtitle: 'Through your job',
      type: 'result',
      status: 'eligible',
      explanation: 'You have access to employer-sponsored insurance. This is typically the most cost-effective option as employers usually cover 50-80% of premiums. Review the plan details during your enrollment window.',
    })
    edges.push({ from: 'start', to: 'employer' })
  }

  // --- School / ISP for students ---
  if (['f1_student', 'j1_scholar', 'j2'].includes(profile.immigrationStatus) || profile.isStudent) {
    eligible.push('school_plan')
    eligible.push('international_student_plan')
    nodes.push({
      id: 'school_plan',
      label: 'University health plan',
      subtitle: 'Often required for enrollment',
      type: 'result',
      status: 'eligible',
      explanation: 'Most universities offer a Student Health Insurance Plan (SHIP). Many schools require international students to enroll unless they can prove comparable coverage. Check if your school allows a waiver.',
    })
    nodes.push({
      id: 'isp',
      label: 'International student plan',
      subtitle: 'Private ISP as alternative',
      type: 'result',
      status: 'eligible',
      explanation: 'International Student Plans (ISPs) are private health plans designed for international students. They often cost less than school plans and can satisfy waiver requirements. Compare carefully — networks and coverage levels vary.',
    })
    edges.push({ from: 'start', to: 'school_plan' })
    edges.push({ from: 'start', to: 'isp' })

    if (profile.immigrationStatus === 'j1_scholar') {
      circumstances.push('J-1 federal mandate: you are legally required to carry health insurance meeting specific minimums (22 CFR 62.14). Verify any plan meets these requirements.')
    }

    // Add context for students graduating soon
    if (profile.yearsLeftInCollege === 'less_than_1') {
      circumstances.push('You\'re graduating soon — check your school plan\'s termination date and plan your transition to post-graduation coverage (employer plan, ACA marketplace, or COBRA) in advance.')
    }
  }

  // --- Short-term plans ---
  const shortTermEligible = !['us_citizen', 'green_card', 'refugee_asylee'].includes(profile.immigrationStatus) ||
    profile.hasEmployerInsurance === false
  if (shortTermEligible) {
    eligible.push('short_term')
    nodes.push({
      id: 'short_term',
      label: 'Short-term health plan',
      subtitle: 'Limited coverage — use with caution',
      type: 'result',
      status: 'pending',
      explanation: 'Short-term plans are available to most people but have significant gaps: no coverage for pre-existing conditions, mental health, maternity, or preventive care. They should be a last resort. Duration is usually 1-3 months, renewable in some states.',
    })
    edges.push({ from: 'start', to: 'short_term' })
    circumstances.push('Short-term plans are available but have serious coverage limitations. Review carefully before enrolling.')
  }

  // COBRA
  if (['unemployed_seeking', 'unemployed_not_seeking'].includes(profile.employmentStatus) && profile.currentlyInsured) {
    eligible.push('cobra')
    circumstances.push('You may be eligible for COBRA continuation coverage. You have 60 days from job loss to elect it. Cost is high — you pay the full premium — but coverage is identical to your prior plan.')
    nextSteps.push({
      id: 'cobra',
      title: 'Elect COBRA within 60 days',
      description: 'Contact your former employer\'s HR department. You have exactly 60 days from your coverage end date to elect COBRA.',
      priority: 'high',
    })
  }

  // Determine primary recommendation
  const priority: PlanType[] = [
    'medicaid', 'employer_sponsored', 'aca_marketplace',
    'school_plan', 'international_student_plan', 'cobra', 'short_term'
  ]
  const primaryRecommendation = priority.find(p => eligible.includes(p)) || 'short_term'

  // Adjust recommendation based on healthcare usage and medications
  let adjustedPrimary = primaryRecommendation
  if (
    primaryRecommendation === 'school_plan' &&
    profile.yearsLeftInCollege === 'less_than_1' &&
    eligible.includes('aca_marketplace')
  ) {
    // If graduating soon and ACA-eligible, ACA might be better long term
    // Still recommend school plan for now but note the transition
    circumstances.push('Since you\'re graduating soon, start exploring ACA marketplace options now so you\'re ready to transition without a coverage gap.')
  }

  // Medication users: flag formulary importance
  if (profile.takesRegularMedications) {
    circumstances.push('Since you take regular medications, verify the plan\'s formulary (drug coverage list) before enrolling. Tiers 1-2 are usually generic/preferred brands with lowest copays.')
  }

  // High usage: steer toward comprehensive plans
  if (profile.expectedHealthcareUsage === 'high') {
    circumstances.push('With frequent healthcare needs, prioritize plans with lower deductibles and out-of-pocket maximums, even if monthly premiums are higher.')
  }

  // Build next steps
  if (eligible.includes('medicaid')) {
    nextSteps.push({
      id: 'apply_medicaid',
      title: 'Apply for Medicaid',
      description: `Apply at your state's Medicaid office or through Healthcare.gov. Bring proof of identity, income, and immigration status.`,
      priority: 'high',
      actionUrl: 'https://www.healthcare.gov/medicaid-chip/',
    })
  }

  if (eligible.includes('aca_marketplace')) {
    nextSteps.push({
      id: 'browse_marketplace',
      title: 'Browse marketplace plans',
      description: 'Visit Healthcare.gov or your state exchange to compare plans. Open Enrollment runs Nov 1 – Jan 15.',
      priority: eligible.includes('medicaid') ? 'medium' : 'high',
      actionUrl: 'https://www.healthcare.gov',
    })
  }

  if (eligible.includes('school_plan') || eligible.includes('international_student_plan')) {
    nextSteps.push({
      id: 'check_school',
      title: 'Check your school\'s insurance requirement',
      description: 'Log into your student portal to see if insurance enrollment is mandatory and when the enrollment/waiver deadline is.',
      priority: 'high',
    })
  }

  // Run cost estimation across all eligible plans
  const costEstimates = estimateCosts(profile, eligible)

  // Potentially override recommendation for budget-constrained profiles
  const budget = profile.monthlyPremiumBudget as unknown as string
  const isBudgetConstrained = budget === 'under_100' || budget === '100_to_300'
  if (isBudgetConstrained && costEstimates.length > 0) {
    const primaryEstimate = costEstimates.find(e => e.planType === adjustedPrimary)
    const cheapest = costEstimates[0]
    if (primaryEstimate && cheapest.planType !== adjustedPrimary) {
      const primaryCost = primaryEstimate.estimatedAnnualTotal.low
      const cheapestCost = cheapest.estimatedAnnualTotal.low
      if (primaryCost > 0 && (primaryCost - cheapestCost) / primaryCost > 0.2) {
        const savingsPct = Math.round((primaryCost - cheapestCost) / primaryCost * 100)
        circumstances.push(
          `Cost-adjusted recommendation: ${cheapest.planLabel} is estimated ${savingsPct}% cheaper per year (~$${cheapestCost.toLocaleString()} vs ~$${primaryCost.toLocaleString()}) than ${primaryEstimate.planLabel}. Given your budget constraints, this plan has been prioritized.`
        )
        adjustedPrimary = cheapest.planType
      }
    }
  }

  const bestOptionReasoning = buildBestOptionReasoning(adjustedPrimary, profile, fplPct, eligible)

  return {
    eligiblePlans: eligible,
    ineligiblePlans: ineligible,
    primaryRecommendation: adjustedPrimary,
    bestOptionReasoning,
    subsidyEligible: acaEligible && fplPct >= 100 && fplPct <= 400,
    estimatedSubsidy: undefined,
    costEstimates,
    specialCircumstances: circumstances,
    nextSteps,
    flowchartNodes: nodes,
    flowchartEdges: edges,
  }
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    us_citizen: 'US Citizen',
    green_card: 'Green Card (LPR)',
    h1b: 'H-1B Work Visa',
    h4: 'H-4 Dependent',
    f1_student: 'F-1 Student',
    f1_opt: 'F-1 OPT',
    j1_scholar: 'J-1 Scholar',
    j2: 'J-2 Dependent',
    daca: 'DACA',
    refugee_asylee: 'Refugee / Asylee',
    undocumented: 'Undocumented',
    l1: 'L-1 Visa',
    o1: 'O-1 Visa',
    tn: 'TN Visa',
    other: 'Other Status',
  }
  return labels[status] || status
}
