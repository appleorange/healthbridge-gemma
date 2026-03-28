import type { UserProfile, EligibilityResult, PlanType, FlowchartNode, FlowchartEdge, NextStep } from '@/types'
import { estimateCosts } from '@/lib/calculators/cost-estimator'
import { matchEmployerPlans } from '@/lib/plans/plan-finder'

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

    case 'parent_plan': {
      const insurer = profile.parentPlanInsurer ? `your ${profile.parentPlanInsurer}` : "your parent/spouse's"
      const planTypeLabel = profile.parentPlanType && profile.parentPlanType !== 'unknown'
        ? ` ${profile.parentPlanType.toUpperCase()}` : ''
      parts.push(`Staying on ${insurer}${planTypeLabel} plan is your best option right now.`)
      if (profile.parentPlanPremiumContribution === '0') {
        parts.push("Since it costs you nothing, this is hard to beat — any alternative plan would add a monthly premium to your budget.")
      }
      if (profile.parentPlanSatisfied === 'very_happy') {
        parts.push("You've indicated you're happy with the coverage, which confirms this is working well for you.")
      }
      if (profile.agingOffDate && profile.agingOffDate !== 'over_2_years' && profile.agingOffDate !== 'unknown') {
        parts.push("Keep in mind you'll need to transition off this plan when you turn 26 — start planning that transition in advance.")
      }
      break
    }

    default:
      parts.push('Based on your profile, review the available options carefully and consider speaking with a navigator for personalized guidance.')
  }

  return parts.join(' ')
}

function evaluateParentPlan(profile: UserProfile, fplPct: number): 'stay' | 'consider_switching' | 'switch' {
  let stayScore = 0
  let switchScore = 0

  // Strong signals to stay
  if (profile.parentPlanSatisfied === 'very_happy') stayScore += 3
  if (profile.parentPlanPremiumContribution === '0') stayScore += 3
  if (profile.agingOffDate === 'over_2_years') stayScore += 2
  if (profile.parentPlanType === 'ppo') stayScore += 1
  if (profile.parentPlanSatisfied === 'somewhat_happy') stayScore += 1

  // Strong signals to switch
  if (profile.agingOffDate === 'already_aged_off') switchScore += 5
  if (profile.agingOffDate === 'under_1_year') switchScore += 3
  if (profile.parentPlanSatisfied === 'unhappy') switchScore += 3
  if (
    profile.parentPlanPremiumContribution === 'over_300' &&
    fplPct >= 100 && fplPct <= 400
  ) switchScore += 2
  if (
    profile.parentPlanType === 'hmo' &&
    Array.isArray(profile.benefitPriorities) &&
    profile.benefitPriorities.includes('specialist_access')
  ) switchScore += 2

  if (switchScore >= 4) return 'switch'
  if (switchScore >= 2 || stayScore < 2) return 'consider_switching'
  return 'stay'
}

export function calculateEligibility(profile: UserProfile): EligibilityResult {
  const eligible: PlanType[] = []
  const ineligible: PlanType[] = []
  const circumstances: string[] = []
  const nextSteps: NextStep[] = []
  const nodes: FlowchartNode[] = []
  const edges: FlowchartEdge[] = []
  const fplPct = getFPLPercentage(profile.annualIncome, profile.householdSize)

  // ── Helper: add node and register edge from parent ──
  function addNode(node: FlowchartNode, parentId?: string, edgeLabel?: string) {
    nodes.push(node)
    if (parentId) {
      edges.push({ from: parentId, to: node.id, label: edgeLabel })
      // Maintain children array on parent
      const parent = nodes.find(n => n.id === parentId)
      if (parent) {
        parent.children = [...(parent.children ?? []), node.id]
      }
    }
  }

  // ── Start node ──
  const startNode: FlowchartNode = {
    id: 'start',
    label: 'Immigration status',
    subtitle: formatStatus(profile.immigrationStatus),
    type: 'question',
    status: 'active',
    primaryPath: true,
    explanation: 'Your immigration status is the primary determinant of which health insurance options are available to you in the United States.',
    profileData: `Status: ${formatStatus(profile.immigrationStatus)}`,
    children: [],
  }
  nodes.push(startNode)

  // ── ACA / Marketplace eligibility ──
  const acaEligibleStatuses = ['us_citizen', 'green_card', 'refugee_asylee', 'l1', 'o1', 'tn']
  const acaEligible = acaEligibleStatuses.includes(profile.immigrationStatus)

  if (acaEligible) {
    eligible.push('aca_marketplace')
    const subsidyEligible = fplPct >= 100 && fplPct <= 400 && !profile.hasEmployerInsurance
    const acaChildren: string[] = subsidyEligible ? ['subsidy'] : []
    addNode({
      id: 'aca_result',
      label: 'ACA marketplace',
      subtitle: 'Healthcare.gov or state exchange',
      type: 'result',
      status: 'eligible',
      explanation: 'You can purchase a plan on the ACA marketplace. Open enrollment runs Nov 1 – Jan 15. You may qualify for a Premium Tax Credit based on your income.',
      children: acaChildren,
      profileData: `Status: ${formatStatus(profile.immigrationStatus)} → lawfully present`,
    }, 'start', 'ACA eligible')

    if (subsidyEligible) {
      circumstances.push(`You may qualify for a Premium Tax Credit — your income is approximately ${Math.round(fplPct)}% of the federal poverty level.`)
      addNode({
        id: 'subsidy',
        label: 'Premium Tax Credit',
        subtitle: `~${Math.round(fplPct)}% FPL — subsidy available`,
        type: 'result',
        status: 'eligible',
        explanation: 'Premium Tax Credits reduce your monthly premium. The amount depends on your income relative to the federal poverty level and the cost of the benchmark Silver plan in your area.',
        legalBasis: 'ACA Section 1401; 26 USC § 36B',
        profileData: `Income $${profile.annualIncome.toLocaleString()} = ${Math.round(fplPct)}% FPL → qualifies (100–400% FPL range)`,
      }, 'aca_result', 'Income check')
    }
  } else {
    ineligible.push('aca_marketplace')
    const acaIneligibleReason = profile.immigrationStatus === 'undocumented'
      ? 'Undocumented individuals are excluded from ACA marketplace plans and subsidies'
      : profile.immigrationStatus === 'daca'
      ? 'DACA recipients are explicitly excluded from ACA marketplace eligibility under federal rules'
      : `${formatStatus(profile.immigrationStatus)} is a non-immigrant status that does not meet the "lawfully present" standard`
    addNode({
      id: 'aca_result',
      label: 'ACA marketplace',
      subtitle: 'Not eligible — status requirement',
      type: 'result',
      status: 'ineligible',
      explanation: `${acaIneligibleReason}. Non-immigrant visa holders (F-1, J-1, H-1B) and undocumented individuals cannot receive marketplace subsidies.`,
      legalBasis: '45 CFR § 155.305(a); ACA Section 1312(f)(3)',
      whatWouldChange: 'A qualifying immigration status change (green card, citizenship, or refugee/asylee grant) would make you ACA marketplace eligible.',
      profileData: `Status: ${formatStatus(profile.immigrationStatus)} → not in lawfully-present category`,
    }, 'start', 'ACA check')
  }

  // ── Medicaid eligibility ──
  const medicaidStatusEligible = ['us_citizen', 'refugee_asylee'].includes(profile.immigrationStatus)
  const medicaidLPR = profile.immigrationStatus === 'green_card'
  const medicaidDACA = profile.immigrationStatus === 'daca' && DACA_MEDICAID_STATES.includes(profile.state)
  const medicaidStatusQualifies = medicaidStatusEligible || medicaidLPR || medicaidDACA
  const medicaidIncomeThreshold = ACA_EXPANSION_STATES.includes(profile.state) ? 138 : 100
  const medicaidIncomeEligible = fplPct <= medicaidIncomeThreshold

  const medicaidEligible = medicaidStatusQualifies && medicaidIncomeEligible

  if (medicaidStatusQualifies) {
    // Status qualifies — determine if income is the gating factor
    if (medicaidEligible) {
      eligible.push('medicaid')
      addNode({
        id: 'medicaid_result',
        label: 'Medicaid',
        subtitle: 'Free or low-cost coverage',
        type: 'result',
        status: 'eligible',
        explanation: 'You appear eligible for Medicaid. Apply through your state\'s Medicaid agency or Healthcare.gov. Coverage can start as soon as the month you apply.',
        legalBasis: '42 USC § 1396a; Social Security Act § 1902',
        profileData: `Income $${profile.annualIncome.toLocaleString()} = ${Math.round(fplPct)}% FPL → under ${medicaidIncomeThreshold}% threshold for ${profile.state}`,
      }, 'start', 'Medicaid check')
    } else {
      ineligible.push('medicaid')
      const inExpansionState = ACA_EXPANSION_STATES.includes(profile.state)
      const fplBase = { 1: 15650, 2: 21150, 3: 26650, 4: 32150, 5: 37650, 6: 43150, 7: 48650, 8: 54150 }
      const baseFPL = fplBase[Math.min(profile.householdSize, 8) as keyof typeof fplBase] ?? 54150
      const medicaidIncomeLimit = Math.round(baseFPL * medicaidIncomeThreshold / 100)
      const incomeGap = Math.round(profile.annualIncome - medicaidIncomeLimit)
      addNode({
        id: 'medicaid_result',
        label: 'Medicaid',
        subtitle: `${Math.round(fplPct)}% FPL — limit is ${medicaidIncomeThreshold}%`,
        type: 'result',
        status: 'ineligible',
        explanation: `Your income (${Math.round(fplPct)}% FPL) exceeds the Medicaid limit of ${medicaidIncomeThreshold}% FPL in ${profile.state}${inExpansionState ? ' (an expansion state)' : ' (a non-expansion state)'}.`,
        legalBasis: '42 USC § 1396a; 42 CFR § 435.119',
        whatWouldChange: `Your income ($${profile.annualIncome.toLocaleString()}/yr) is $${incomeGap.toLocaleString()} above the ${medicaidIncomeThreshold}% FPL limit of $${medicaidIncomeLimit.toLocaleString()}/yr for a household of ${profile.householdSize} in ${profile.state}.${!ACA_EXPANSION_STATES.includes(profile.state) ? ' Moving to a Medicaid expansion state would raise the threshold to 138% FPL.' : ''}`,
        profileData: `Income $${profile.annualIncome.toLocaleString()} = ${Math.round(fplPct)}% FPL → exceeds ${medicaidIncomeThreshold}% threshold`,
      }, 'start', 'Medicaid check')
    }
  } else {
    // Status does not qualify at all
    ineligible.push('medicaid')
    const statusReason = profile.immigrationStatus === 'undocumented'
      ? 'Undocumented individuals are not eligible for federal Medicaid (Emergency Medicaid only for immediate life-threatening emergencies)'
      : profile.immigrationStatus === 'daca'
      ? `DACA recipients are not eligible for federal Medicaid. In ${profile.state}, state-funded Medicaid for DACA is ${DACA_MEDICAID_STATES.includes(profile.state) ? 'available' : 'not available'}.`
      : `${formatStatus(profile.immigrationStatus)} visa holders are not eligible for federal Medicaid`
    addNode({
      id: 'medicaid_result',
      label: 'Medicaid',
      subtitle: 'Not eligible — immigration status',
      type: 'result',
      status: 'ineligible',
      explanation: statusReason,
      legalBasis: '8 USC § 1611; 8 USC § 1612; Social Security Act § 1903(v)',
      whatWouldChange: 'Receiving a green card (and waiting 5 years in most states), gaining citizenship, or being granted refugee/asylee status would make you federally Medicaid-eligible.',
      profileData: `Status: ${formatStatus(profile.immigrationStatus)} → not in federally-eligible category`,
    }, 'start', 'Medicaid check')
  }

  // ── Employer-sponsored ──
  if (profile.hasEmployerInsurance) {
    eligible.push('employer_sponsored')
    const employerMatch = matchEmployerPlans(profile.employerName)
    const employerPlanIds = employerMatch
      ? employerMatch.data.plans.map((_, idx) => `employer_plan_${idx}`)
      : []
    addNode({
      id: 'employer',
      label: 'Employer-sponsored plan',
      subtitle: profile.employerName ? `Through ${profile.employerName}` : 'Through your job',
      type: 'result',
      status: 'eligible',
      explanation: employerMatch
        ? `You have access to employer-sponsored insurance through ${profile.employerName}. ${employerMatch.data.notes} ${employerMatch.data.enrollmentTip}`
        : 'You have access to employer-sponsored insurance. Employers typically cover 50–80% of premiums, making this the most cost-effective option. Review plan details during your enrollment window.',
      children: employerPlanIds,
      profileData: `Employer: ${profile.employerName ?? 'unknown'} → insurance offered`,
    }, 'start', 'Employed')

    if (employerMatch) {
      employerMatch.data.plans.forEach((planName, idx) => {
        addNode({
          id: `employer_plan_${idx}`,
          label: planName,
          subtitle: profile.employerName ?? employerMatch.key,
          type: 'result',
          status: 'eligible',
          explanation: `${employerMatch.data.notes} Enrollment tip: ${employerMatch.data.enrollmentTip}`,
          profileData: `Employer ${profile.employerName} → known plan offering`,
        }, 'employer', 'Option')
      })
    }
  }

  // ── School / ISP — only for actual students or student visas ──
  const isInternationalStudentVisa = ['f1_student', 'f1_opt', 'j1_scholar', 'j2'].includes(profile.immigrationStatus)
  const isStudentContext = isInternationalStudentVisa || (
    profile.isStudent === true &&
    !['us_citizen', 'green_card', 'refugee_asylee', 'daca'].includes(profile.immigrationStatus)
  )

  if (isStudentContext) {
    eligible.push('school_plan')

    addNode({
      id: 'school_plan',
      label: 'University health plan (SHIP)',
      subtitle: profile.university ? `${profile.university} plan` : 'Often required for enrollment',
      type: 'result',
      status: 'eligible',
      explanation: 'Most universities offer a Student Health Insurance Plan (SHIP). Many schools require international students to enroll unless they can prove comparable coverage. Check if your school allows a waiver.',
      profileData: `Student status: ${profile.immigrationStatus}${profile.university ? ` at ${profile.university}` : ''}`,
    }, 'start', 'Student')

    if (isInternationalStudentVisa) {
      eligible.push('international_student_plan')
      addNode({
        id: 'isp',
        label: 'International student plan (ISP)',
        subtitle: 'Private plan, may satisfy waiver',
        type: 'result',
        status: 'eligible',
        explanation: 'International Student Plans (ISPs) are private health plans designed for international students. They often cost less than school plans and can satisfy waiver requirements.',
        profileData: `Visa: ${formatStatus(profile.immigrationStatus)} → ISP eligible`,
      }, 'start', 'Student alt.')
    }

    if (profile.immigrationStatus === 'j1_scholar') {
      circumstances.push('J-1 federal mandate: you are legally required to carry health insurance meeting specific minimums (22 CFR 62.14). Verify any plan meets these requirements.')
    }
    if (profile.yearsLeftInCollege === 'less_than_1') {
      circumstances.push('You\'re graduating soon — check your school plan\'s termination date and plan your transition to post-graduation coverage in advance.')
    }
  }

  // ── COBRA ──
  if (['unemployed_seeking', 'unemployed_not_seeking'].includes(profile.employmentStatus) && profile.currentlyInsured) {
    eligible.push('cobra')
    circumstances.push('You may be eligible for COBRA continuation coverage. You have 60 days from job loss to elect it. Cost is high — you pay the full premium — but coverage is identical to your prior plan.')
    nextSteps.push({
      id: 'cobra',
      title: 'Elect COBRA within 60 days',
      description: 'Contact your former employer\'s HR department. You have exactly 60 days from your coverage end date to elect COBRA.',
      priority: 'high',
    })
    addNode({
      id: 'cobra_result',
      label: 'COBRA continuation',
      subtitle: 'Keep your prior employer plan',
      type: 'result',
      status: 'eligible',
      explanation: 'COBRA lets you continue your prior employer\'s coverage after job loss — same plan, same network, same providers. You pay the full premium (no employer subsidy). Election window is 60 days from coverage end date.',
      legalBasis: '29 USC § 1161-1168 (ERISA Title I, Part 6)',
      whatWouldChange: 'COBRA is time-limited (18 months typically). Compare against ACA marketplace plans — job loss is a Special Enrollment Period trigger.',
      profileData: `Employment: ${profile.employmentStatus} + previously insured → COBRA eligible`,
    }, 'start', 'Job loss')
  }

  // ── Short-term plans ──
  const shortTermEligible = !['us_citizen', 'green_card', 'refugee_asylee'].includes(profile.immigrationStatus) ||
    !profile.hasEmployerInsurance
  if (shortTermEligible) {
    eligible.push('short_term')
    addNode({
      id: 'short_term',
      label: 'Short-term health plan',
      subtitle: 'Limited coverage — last resort',
      type: 'result',
      status: 'pending',
      explanation: 'Short-term plans are available to most people but have significant gaps: no coverage for pre-existing conditions, mental health, maternity, or preventive care. They should be a last resort. Duration is usually 1–3 months.',
      whatWouldChange: 'Qualifying for a more comprehensive option (employer plan, ACA marketplace, Medicaid) is always preferable. Short-term plans should only be used to bridge temporary gaps.',
      profileData: `No primary comprehensive coverage available → short-term as fallback`,
    }, 'start', 'Fallback')
    circumstances.push('Short-term plans are available but have serious coverage limitations. Review carefully before enrolling.')
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

  // ── Dependent: add parent_plan to eligible so it appears in cost estimates ──
  const isOnParentPlan = profile.currentPlanType === 'parent_employer'

  if (isOnParentPlan) {
    eligible.push('parent_plan')
    const insurer = profile.parentPlanInsurer ?? "parent/spouse's"
    const typeLabel = profile.parentPlanType && profile.parentPlanType !== 'unknown'
      ? ` ${profile.parentPlanType.toUpperCase()}` : ''
    addNode({
      id: 'parent_plan',
      label: "Parent/spouse's plan",
      subtitle: `${insurer}${typeLabel} plan`,
      type: 'result',
      status: 'pending', // will be updated after evaluateParentPlan
      explanation: 'You are currently covered as a dependent. Evaluation in progress based on your plan details.',
      profileData: `Dependent on: ${profile.dependentOnWhom ?? 'parent/spouse'} · insurer: ${profile.parentPlanInsurer ?? 'unknown'} · type: ${profile.parentPlanType ?? 'unknown'} · cost: $${profile.parentPlanPremiumContribution ?? '?'}/mo`,
    }, 'start', 'Dependent coverage')
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

  // ── Dependent: evaluate parent plan vs alternatives ──
  if (isOnParentPlan) {
    const parentRec = evaluateParentPlan(profile, fplPct)
    const insurer = profile.parentPlanInsurer ?? "parent/spouse's"
    const typeLabel = profile.parentPlanType && profile.parentPlanType !== 'unknown'
      ? ` ${profile.parentPlanType.toUpperCase()}` : ''
    const planDesc = `${insurer}${typeLabel} plan`

    // Update the parent_plan node status based on recommendation
    const ppNode = nodes.find(n => n.id === 'parent_plan')
    if (ppNode) {
      ppNode.status = parentRec === 'stay' ? 'eligible' : parentRec === 'consider_switching' ? 'pending' : 'ineligible'
      ppNode.primaryPath = parentRec === 'stay'
      ppNode.whatWouldChange = parentRec === 'stay'
        ? "A significant change — like aging off at 26, losing satisfaction with coverage, or finding a cheaper option with subsidy — would change this recommendation."
        : parentRec === 'consider_switching'
        ? "Compare this plan side-by-side with your alternative options in the Cost Estimate tab."
        : "Transitioning to your own coverage is recommended given your current situation."
      ppNode.explanation = parentRec === 'stay'
        ? `Staying on ${planDesc} is your best option based on the details you provided.`
        : parentRec === 'consider_switching'
        ? `You may want to compare ${planDesc} against alternatives. See the Cost Estimate tab.`
        : `Transitioning off ${planDesc} is recommended — see next steps below.`
    }

    if (parentRec === 'stay') {
      adjustedPrimary = 'parent_plan'
      circumstances.push(
        `Based on what you told us about your ${planDesc}, staying on it appears to be your best option right now.`
      )
      nextSteps.push({
        id: 'review_annual',
        title: 'Review your coverage annually',
        description: 'Especially as you approach age 26 — start exploring your own options at least 6 months before you lose eligibility.',
        priority: 'low',
      })
    } else if (parentRec === 'consider_switching') {
      const reasons: string[] = []
      if (profile.agingOffDate === '1_to_2_years') reasons.push('your approaching age limit')
      if (profile.parentPlanSatisfied === 'somewhat_happy') reasons.push('the coverage gaps you mentioned')
      if (profile.parentPlanPremiumContribution === 'over_300') reasons.push('the high monthly cost to you')
      const reasonText = reasons.length > 0 ? reasons.join(' and ') : 'your specific situation'
      const ALT_LABELS: Partial<Record<PlanType, string>> = {
        aca_marketplace: 'an ACA marketplace plan', medicaid: 'Medicaid',
        employer_sponsored: 'an employer-sponsored plan', school_plan: 'a school plan',
      }
      const altLabel = ALT_LABELS[adjustedPrimary as PlanType] ?? String(adjustedPrimary).replace(/_/g, ' ')
      circumstances.push(
        `You're currently on your ${planDesc}. Based on your profile, you may want to compare it against ${altLabel} — especially given ${reasonText}.`
      )
    } else {
      const reasons: string[] = []
      if (profile.agingOffDate === 'already_aged_off') reasons.push('you have already aged off or are about to age off')
      else if (profile.agingOffDate === 'under_1_year') reasons.push("you're within a year of aging off at 26")
      else if (profile.parentPlanSatisfied === 'unhappy') reasons.push("you're not satisfied with your current coverage")
      const reason = reasons[0] ?? 'based on your situation'
      nextSteps.push({
        id: 'transition_now',
        title: "Transition off your parent's plan — act now",
        description: `You should transition off your ${planDesc} — ${reason}. Losing dependent coverage is a qualifying life event giving you 60 days to enroll in a new plan.`,
        priority: 'high',
      })
    }
  }

  const bestOptionReasoning = buildBestOptionReasoning(adjustedPrimary, profile, fplPct, eligible)

  // ── Mark primary path nodes ──
  const primaryResultNodeId = adjustedPrimary === 'employer_sponsored' ? 'employer'
    : adjustedPrimary === 'medicaid' ? 'medicaid_result'
    : adjustedPrimary === 'aca_marketplace' ? 'aca_result'
    : adjustedPrimary === 'school_plan' ? 'school_plan'
    : adjustedPrimary === 'international_student_plan' ? 'isp'
    : adjustedPrimary === 'cobra' ? 'cobra_result'
    : adjustedPrimary === 'parent_plan' ? 'parent_plan'
    : 'short_term'

  // Walk from primary result back to start via edges and mark all as primaryPath
  const primaryPathIds = new Set<string>(['start', primaryResultNodeId])
  // Subsidy is on the primary path when ACA is primary
  if (adjustedPrimary === 'aca_marketplace') {
    const subsidyNode = nodes.find(n => n.id === 'subsidy')
    if (subsidyNode) primaryPathIds.add('subsidy')
  }
  nodes.forEach(n => {
    if (primaryPathIds.has(n.id)) n.primaryPath = true
  })

  // ── Network checker node if user has preferred providers ──
  if (profile.preferredDoctors) {
    addNode({
      id: 'network_check',
      label: 'Provider network check',
      subtitle: profile.preferredDoctors,
      type: 'action',
      status: 'pending',
      primaryPath: true,
      explanation: `You indicated you want to keep ${profile.preferredDoctors}. Network availability varies by plan — HMO plans restrict you to their network, PPO plans give more flexibility. Use the Network Checker tab to verify before enrolling.`,
      profileData: `Preferred providers: ${profile.preferredDoctors}`,
    }, primaryResultNodeId, 'Next step')
  }

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
