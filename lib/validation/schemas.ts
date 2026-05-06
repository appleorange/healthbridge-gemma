import { z } from 'zod'

const immigrationStatuses = [
  'us_citizen', 'green_card', 'h1b', 'h4', 'f1_student', 'f1_opt',
  'j1_scholar', 'j2', 'l1', 'o1', 'tn', 'daca', 'refugee_asylee',
  'tps', 'parolee', 'undocumented', 'other',
] as const

const employmentStatuses = [
  'employed_fulltime', 'employed_parttime', 'self_employed',
  'unemployed_seeking', 'unemployed_not_seeking', 'student', 'retired', 'dependent',
] as const

const planTypes = [
  'medicaid', 'chip', 'aca_marketplace', 'employer_sponsored', 'school_plan',
  'international_student_plan', 'short_term', 'cobra', 'medicare', 'va',
  'parent_plan', 'none',
] as const

const benefitPriorities = [
  'vision', 'dental', 'hearing', 'mental_health', 'maternity',
  'prescriptions', 'fitness', 'transportation', 'over_the_counter',
  'specialist_access', 'emergency_care',
] as const

export const UserProfileSchema = z.object({
  // Required fields
  immigrationStatus: z.enum(immigrationStatuses),
  employmentStatus: z.enum(employmentStatuses),
  state: z.string().min(2).max(2),
  householdSize: z.number().int().min(1).max(20),
  annualIncome: z.number().min(0).max(10_000_000),
  age: z.number().int().min(0).max(130),
  hasDependents: z.boolean(),
  currentlyInsured: z.boolean(),
  hasEmployerInsurance: z.boolean(),
  isStudent: z.boolean(),
  // Optional employment fields
  currentPlanType: z.string().max(100).optional(),
  employerName: z.string().max(200).optional(),
  employerOpenEnrollmentMonth: z.string().max(50).optional(),
  currentEmployerPlan: z.string().max(200).optional(),
  jobSearchTimeline: z.enum(['less_than_3mo', '3_to_6mo', 'over_6mo']).optional(),
  onCOBRA: z.boolean().optional(),
  cobraMonthsRemaining: z.number().int().min(0).max(36).optional(),
  formerEmployerInsurance: z.boolean().optional(),
  hasHSA: z.boolean().optional(),
  // Optional student fields
  university: z.string().max(200).optional(),
  yearsLeftInCollege: z.enum(['less_than_1', '1_to_2', '2_to_4', '4_plus']).optional(),
  schoolRequiresInsurance: z.boolean().optional(),
  // Optional dependent fields
  dependentCoverageEndDate: z.string().max(50).optional(),
  dependentOnWhom: z.enum(['parent', 'spouse', 'partner']).optional(),
  parentPlanInsurer: z.string().max(200).optional(),
  parentPlanType: z.enum(['hmo', 'ppo', 'hdhp', 'epo', 'unknown']).optional(),
  parentPlanDeductible: z.enum(['under_500', '500_to_1500', '1500_to_3000', 'over_3000', 'unknown']).optional(),
  parentPlanPremiumContribution: z.enum(['0', 'under_100', '100_to_300', 'over_300', 'unknown']).optional(),
  parentPlanSatisfied: z.enum(['very_happy', 'somewhat_happy', 'unhappy']).optional(),
  agingOffDate: z.enum(['over_2_years', '1_to_2_years', 'under_1_year', 'already_aged_off', 'unknown']).optional(),
  yearsAsLPR: z.number().min(0).max(50).optional(),
  // Optional health fields
  expectedHealthcareUsage: z.enum(['minimal', 'moderate', 'high']).optional(),
  takesRegularMedications: z.boolean().optional(),
  numberOfPrescriptions: z.number().int().min(0).max(50).optional(),
  hasChronicConditions: z.boolean().optional(),
  chronicConditionList: z.string().max(500).optional(),
  expectedProcedures: z.string().max(500).optional(),
  preferredDoctors: z.string().max(500).optional(),
  monthlyPremiumBudget: z.number().min(0).optional(),
  filingStatus: z.enum(['single', 'married_joint', 'married_separate', 'head_of_household', 'not_applicable']).optional(),
  receivingUnemploymentBenefits: z.boolean().optional(),
  unemployedMonths: z.number().int().min(0).max(24).optional(),
  zipCode: z.string().regex(/^\d{5}$/).optional(),
  benefitPriorities: z.array(z.enum(benefitPriorities)).max(11).optional(),
  hospitalVisitFrequency: z.enum(['never', '1_to_2_per_year', 'monthly', 'regularly']).optional(),
  specificHealthConcerns: z.array(z.string().max(100)).max(20).optional(),
  expectsSurgeryOrProcedure: z.boolean().optional(),
})

export const PlanTypeSchema = z.enum(planTypes)

// ── Per-route request schemas ──────────────────────────────────────────────

export const EligibilityRequestSchema = z.object({
  profile: UserProfileSchema,
  language: z.enum(['en', 'es']).optional(),
})

export const PlansRequestSchema = z.object({
  profile: UserProfileSchema,
  eligiblePlans: z.array(PlanTypeSchema).max(20),
  primaryRecommendation: PlanTypeSchema,
})

export const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(10_000),
  })).min(1).max(50),
  userProfile: UserProfileSchema.optional(),
})

export const DocumentParseRequestSchema = z.object({
  fileData: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
  fileName: z.string().min(1).max(255),
  userProfile: UserProfileSchema.optional(),
})

export const NetworkCheckRequestSchema = z.object({
  providerName: z.string().min(1).max(200),
  providerType: z.enum(['doctor', 'hospital', 'any']),
  zipCode: z.string().regex(/^\d{5}$/),
  planId: z.string().max(100).optional(),
  planName: z.string().max(200).optional(),
  planNetworkType: z.string().max(100).optional(),
})

export const AppealAnalyzeRequestSchema = z.object({
  planName: z.string().min(1).max(200),
  denialReason: z.string().min(1).max(1000),
  denialDate: z.string().min(1).max(50),
  serviceDescription: z.string().min(1).max(500),
  denialCode: z.string().max(50).optional(),
  policyLanguage: z.string().max(2000).optional(),
  planType: z.string().max(100).optional(),
  immigrationStatus: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
})

const DenialInfoSchema = z.object({
  planName: z.string().min(1).max(200),
  serviceDescription: z.string().min(1).max(500),
  denialDate: z.string().min(1).max(50),
  denialReason: z.string().min(1).max(1000),
  denialCode: z.string().max(50).optional(),
  policyLanguage: z.string().max(2000).optional(),
})

const AnalysisResultSchema = z.object({
  denialType: z.string().max(200),
  keyArguments: z.array(z.string().max(500)).min(1).max(10),
}).passthrough()

export const AppealDraftRequestSchema = z.object({
  denialInfo: DenialInfoSchema,
  analysis: AnalysisResultSchema,
  planType: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  age: z.number().int().min(0).max(130).optional(),
})

export const ChecklistRequestSchema = z.object({
  profile: UserProfileSchema,
  language: z.enum(['en', 'es']).optional(),
  eligibility: z.object({
    primaryRecommendation: PlanTypeSchema,
    eligiblePlans: z.array(PlanTypeSchema),
    bestOptionReasoning: z.string().max(2000).optional(),
    subsidyEligible: z.boolean().optional(),
    specialCircumstances: z.array(z.string().max(500)).max(20).optional(),
  }).passthrough(),
})

export const TimelineRequestSchema = z.object({
  profile: UserProfileSchema,
  eligibilityResult: z.object({
    primaryRecommendation: PlanTypeSchema,
    eligiblePlans: z.array(PlanTypeSchema),
    specialCircumstances: z.array(z.string()).max(20),
  }).passthrough(),
})
