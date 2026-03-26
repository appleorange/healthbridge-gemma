// Immigration status options
export type ImmigrationStatus =
  | 'us_citizen'
  | 'green_card'
  | 'h1b'
  | 'h4'
  | 'f1_student'
  | 'f1_opt'
  | 'j1_scholar'
  | 'j2'
  | 'l1'
  | 'o1'
  | 'tn'
  | 'daca'
  | 'refugee_asylee'
  | 'undocumented'
  | 'other'

export type EmploymentStatus =
  | 'employed_fulltime'
  | 'employed_parttime'
  | 'self_employed'
  | 'unemployed_seeking'
  | 'unemployed_not_seeking'
  | 'student'
  | 'retired'
  | 'dependent'

export type USState = string

export interface UserProfile {
  immigrationStatus: ImmigrationStatus
  employmentStatus: EmploymentStatus
  state: USState
  householdSize: number
  annualIncome: number
  age: number
  hasDependents: boolean
  currentlyInsured: boolean
  currentPlanType?: string

  // Employment details
  hasEmployerInsurance: boolean
  employerName?: string
  employerOpenEnrollmentMonth?: string
  jobSearchTimeline?: 'less_than_3mo' | '3_to_6mo' | 'over_6mo'
  onCOBRA?: boolean
  cobraMonthsRemaining?: number
  formerEmployerInsurance?: boolean

  // Self-employment
  hasHSA?: boolean

  // Student details
  isStudent: boolean
  university?: string
  yearsLeftInCollege?: 'less_than_1' | '1_to_2' | '2_to_4' | '4_plus'
  schoolRequiresInsurance?: boolean

  // Dependent details
  dependentCoverageEndDate?: string

  // Green card timing
  yearsAsLPR?: number

  // Healthcare usage
  expectedHealthcareUsage?: 'minimal' | 'moderate' | 'high'
  takesRegularMedications?: boolean
  numberOfPrescriptions?: number
  hasChronicConditions?: boolean
  chronicConditionList?: string
  expectedProcedures?: string
  preferredDoctors?: string
  monthlyPremiumBudget?: number

  // ACA subsidy specific
  filingStatus?: 'single' | 'married_joint' | 'married_separate' | 'head_of_household'
  receivingUnemploymentBenefits?: boolean

  // Location for plan lookup
  zipCode?: string

  // Benefit preferences
  benefitPriorities?: BenefitPriority[]

  // Additional health details
  hospitalVisitFrequency?: 'never' | '1_to_2_per_year' | 'monthly' | 'regularly'
  specificHealthConcerns?: string[]
  expectsSurgeryOrProcedure?: boolean
}

export type BenefitPriority =
  | 'vision'
  | 'dental'
  | 'hearing'
  | 'mental_health'
  | 'maternity'
  | 'prescriptions'
  | 'fitness'
  | 'transportation'
  | 'over_the_counter'
  | 'specialist_access'
  | 'emergency_care'

// Plan card types (for real + mocked plan results)
export interface PlanCard {
  id: string
  name: string
  issuer: string
  planType: PlanType
  networkType: 'HMO' | 'PPO' | 'EPO' | 'HDHP' | 'ISP' | 'SHIP' | 'Medicaid' | 'Other'
  metalTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Catastrophic'
  monthlyPremium: number
  subsidizedPremium?: number
  deductible: number
  oopMax: number
  pcpCopay: number | null
  specialistCopay: number | null
  benefits: { label: string; covered: boolean }[]
  fitScore: number
  fitReasons: string[]
  planUrl?: string
  isReal: boolean // true = from API, false = mocked
  year: number
  rating?: number // CMS star rating 1-5
}

export type PlanType =
  | 'medicaid'
  | 'chip'
  | 'aca_marketplace'
  | 'employer_sponsored'
  | 'school_plan'
  | 'international_student_plan'
  | 'short_term'
  | 'cobra'
  | 'medicare'
  | 'va'
  | 'none'

export interface SubsidyDetails {
  fplPercentage: number
  aptcMonthlyEstimate: number
  aptcAnnualEstimate: number
  csrEligible: boolean
  csrTier?: 'tier1' | 'tier2' | 'tier3'
  estimatedNetPremium?: number
  cliffWarning?: string
  notes: string[]
}

export interface PlanCostEstimate {
  planType: PlanType
  planLabel: string
  estimatedAnnualPremium: number
  estimatedAnnualOutOfPocket: number
  estimatedAnnualTotal: number
  breakdownNotes: string[]
  bestFor: string
}

export interface CostEstimate {
  planType: PlanType
  planLabel: string
  estimatedMonthlyPremium: { low: number; high: number }
  estimatedAnnualOutOfPocket: { low: number; high: number }
  estimatedAnnualTotal: { low: number; high: number }
  subsidyApplied: number
  assumptions: string[]
  bestFor: string
}

export interface EligibilityResult {
  eligiblePlans: PlanType[]
  ineligiblePlans: PlanType[]
  primaryRecommendation: PlanType
  bestOptionReasoning: string
  subsidyEligible: boolean
  estimatedSubsidy?: number
  subsidyDetails?: SubsidyDetails
  costEstimates?: CostEstimate[]
  specialCircumstances: string[]
  nextSteps: NextStep[]
  flowchartNodes: FlowchartNode[]
  flowchartEdges: FlowchartEdge[]
}

export interface NextStep {
  id: string
  title: string
  description: string
  deadline?: string
  priority: 'high' | 'medium' | 'low'
  actionUrl?: string
}

export interface FlowchartNode {
  id: string
  label: string
  subtitle?: string
  type: 'question' | 'result' | 'action' | 'rule'
  status: 'active' | 'eligible' | 'ineligible' | 'pending'
  explanation?: string
  legalBasis?: string
  whatChangesThis?: string
}

export interface FlowchartEdge {
  from: string
  to: string
  label?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  userProfile: UserProfile
  messages: ChatMessage[]
  eligibilityResult?: EligibilityResult
  createdAt: Date
}

export interface OnboardingStep {
  id: string
  title: string
  subtitle: string
  fields: OnboardingField[]
  showWhen?: { field: string; values: unknown[] }
}

export interface OnboardingField {
  id: string
  label: string
  type: 'select' | 'multiselect' | 'number' | 'text' | 'toggle' | 'state_select'
  options?: { value: string; label: string; description?: string }[]
  placeholder?: string
  required: boolean
  helpText?: string
  showWhen?: { field: string; value: unknown }
}

export interface TimelineEvent {
  id: string
  title: string
  description: string
  date: string
  endDate?: string
  type: 'open_enrollment' | 'sep' | 'cobra' | 'university' | 'medicaid' | 'action'
  status: 'active' | 'upcoming' | 'ongoing' | 'action_required' | 'past'
  urgent?: boolean
  actionLabel?: string
  actionUrl?: string
}

export interface ParsedDocument {
  id: string
  fileName: string
  documentType: string
  summary: string
  extractedFields: { label: string; value: string; flagged?: boolean }[]
  deadlines: { label: string; date: string; urgent: boolean }[]
  planDetails?: {
    deductible?: string
    outOfPocketMax?: string
    networkType?: string
    premium?: string
    coinsurance?: string
    copays?: Record<string, string>
  }
}
