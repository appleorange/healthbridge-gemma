import type { OnboardingStep } from '@/types'

export const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DC', label: 'DC' },
  { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' }, { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' }, { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' }, { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' }, { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' }, { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' }, { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' }, { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]

export const ONBOARDING_STEPS: OnboardingStep[] = [
  // ── STEP 1: Immigration status ──────────────────────────────────────────────
  {
    id: 'status',
    title: 'What is your immigration status?',
    subtitle: 'This is the single most important factor in determining your health insurance options.',
    fields: [
      {
        id: 'immigrationStatus',
        label: 'Immigration status',
        type: 'select',
        required: true,
        helpText: 'Select the option that best describes your current status in the US.',
        options: [
          { value: 'us_citizen', label: 'US Citizen', description: 'Born in the US or naturalized' },
          { value: 'green_card', label: 'Green Card (Permanent Resident)', description: 'Lawful permanent resident' },
          { value: 'h1b', label: 'H-1B Work Visa', description: 'Employer-sponsored specialty occupation' },
          { value: 'h4', label: 'H-4 Dependent', description: 'Spouse or child of H-1B holder' },
          { value: 'f1_student', label: 'F-1 Student Visa', description: 'International student' },
          { value: 'f1_opt', label: 'F-1 OPT', description: 'Post-graduation optional practical training' },
          { value: 'j1_scholar', label: 'J-1 Exchange Visitor', description: 'Research, teaching, or cultural exchange' },
          { value: 'j2', label: 'J-2 Dependent', description: 'Spouse or child of J-1 holder' },
          { value: 'l1', label: 'L-1 Intracompany Transfer', description: 'Transferred employee of multinational' },
          { value: 'o1', label: 'O-1 Extraordinary Ability', description: 'Visa for individuals with exceptional talent' },
          { value: 'tn', label: 'TN Visa (NAFTA/USMCA)', description: 'Canadian or Mexican professional' },
          { value: 'daca', label: 'DACA', description: 'Deferred Action for Childhood Arrivals' },
          { value: 'refugee_asylee', label: 'Refugee or Asylee', description: 'Granted refugee status or asylum' },
          { value: 'undocumented', label: 'Undocumented / No Current Status', description: 'No current legal immigration status' },
          { value: 'other', label: 'Other / Not Listed', description: 'My status is not listed above' },
        ],
      },
      // Green card holders: how long?
      {
        id: 'yearsAsLPR',
        label: 'How many years have you held your green card?',
        type: 'select',
        required: false,
        showWhen: { field: 'immigrationStatus', value: 'green_card' },
        helpText: 'The 5-year bar affects Medicaid eligibility for green card holders.',
        options: [
          { value: '0', label: 'Less than 1 year' },
          { value: '1', label: '1–2 years' },
          { value: '3', label: '3–4 years' },
          { value: '5', label: '5 or more years' },
        ],
      },
    ],
  },

  // ── STEP 2: Location ────────────────────────────────────────────────────────
  {
    id: 'location',
    title: 'Where do you live?',
    subtitle: 'Insurance rules, Medicaid expansion, and available programs vary a lot by state.',
    fields: [
      {
        id: 'state',
        label: 'State of residence',
        type: 'state_select',
        required: true,
        helpText: 'Select your current state. This affects Medicaid eligibility, marketplace options, and available programs.',
      },
    ],
  },

  // ── STEP 3: Employment ──────────────────────────────────────────────────────
  {
    id: 'employment',
    title: 'What is your current employment situation?',
    subtitle: 'Your work situation determines which plans are available and when you can enroll.',
    fields: [
      {
        id: 'employmentStatus',
        label: 'Employment status',
        type: 'select',
        required: true,
        options: [
          { value: 'employed_fulltime', label: 'Employed full-time (30+ hrs/week)', description: 'Working for an employer' },
          { value: 'employed_parttime', label: 'Employed part-time (<30 hrs/week)', description: 'Part-time, hourly, or seasonal' },
          { value: 'self_employed', label: 'Self-employed or freelance', description: 'Independent contractor, gig work, or own business' },
          { value: 'student', label: 'Student (not currently working)', description: 'Full-time or part-time student' },
          { value: 'unemployed_seeking', label: 'Unemployed — actively looking for work', description: 'Currently job searching' },
          { value: 'unemployed_not_seeking', label: 'Unemployed — not looking for work', description: 'Not currently job searching' },
          { value: 'retired', label: 'Retired', description: 'No longer working' },
          { value: 'dependent', label: "On someone else's plan", description: "Covered by a spouse's, parent's, or partner's plan" },
        ],
      },

      // ── Employed full/part time ──
      {
        id: 'employerName',
        label: 'What company do you work for?',
        type: 'text',
        placeholder: 'e.g. Google, General Hospital, Self (contractor)',
        required: false,
        showWhen: { field: 'employmentStatus', value: 'employed_fulltime' },
        helpText: 'Helps us identify if your employer has a known benefits window.',
      },
      {
        id: 'employerName',
        label: 'What company do you work for?',
        type: 'text',
        placeholder: 'e.g. Starbucks, Amazon',
        required: false,
        showWhen: { field: 'employmentStatus', value: 'employed_parttime' },
      },
      {
        id: 'hasEmployerInsurance',
        label: 'Does your employer offer health insurance?',
        type: 'toggle',
        required: false,
        showWhen: { field: 'employmentStatus', value: 'employed_fulltime' },
        helpText: "Even if you haven't enrolled yet, tell us if your employer offers coverage.",
      },
      {
        id: 'hasEmployerInsurance',
        label: 'Does your employer offer health insurance to part-time workers?',
        type: 'toggle',
        required: false,
        showWhen: { field: 'employmentStatus', value: 'employed_parttime' },
        helpText: 'Some employers (e.g. Starbucks) offer benefits to part-time workers. Check your offer letter or HR portal.',
      },
      {
        id: 'employerOpenEnrollmentMonth',
        label: 'When is your employer open enrollment?',
        type: 'select',
        required: false,
        showWhen: { field: 'hasEmployerInsurance', value: true },
        helpText: "We'll add a reminder to your enrollment timeline.",
        options: [
          { value: 'january', label: 'January' },
          { value: 'february', label: 'February' },
          { value: 'march', label: 'March' },
          { value: 'april', label: 'April' },
          { value: 'may', label: 'May' },
          { value: 'june', label: 'June' },
          { value: 'july', label: 'July' },
          { value: 'august', label: 'August' },
          { value: 'september', label: 'September' },
          { value: 'october', label: 'October' },
          { value: 'november', label: 'November (most common)' },
          { value: 'december', label: 'December' },
          { value: 'unknown', label: "I'm not sure" },
        ],
      },
      {
        id: 'currentEmployerPlan',
        label: 'Which plan are you currently on?',
        type: 'text',
        placeholder: 'e.g. Anthem PPO, Kaiser HMO Gold, Aetna HDHP',
        required: false,
        showWhen: { field: 'hasEmployerInsurance', value: true },
        helpText: 'Check your insurance card or HR portal. This helps us compare your current plan against your other options at open enrollment.',
      },

      // ── Self-employed ──
      {
        id: 'hasHSA',
        label: 'Do you currently have a Health Savings Account (HSA)?',
        type: 'toggle',
        required: false,
        showWhen: { field: 'employmentStatus', value: 'self_employed' },
        helpText: 'HSAs pair with high-deductible health plans and offer tax advantages for the self-employed.',
      },

      // ── Unemployed seeking ──
      {
        id: 'jobSearchTimeline',
        label: 'How soon do you expect to find a job?',
        type: 'select',
        required: false,
        showWhen: { field: 'employmentStatus', value: 'unemployed_seeking' },
        helpText: "This affects whether a short-term bridge plan or ACA marketplace plan makes more sense.",
        options: [
          { value: 'less_than_3mo', label: 'Within 3 months', description: 'Actively interviewing' },
          { value: '3_to_6mo', label: '3–6 months', description: 'Early stages of search' },
          { value: 'over_6mo', label: 'More than 6 months', description: 'Long-term transition' },
        ],
      },
      {
        id: 'formerEmployerInsurance',
        label: 'Did your last job offer health insurance?',
        type: 'toggle',
        required: false,
        showWhen: { field: 'employmentStatus', value: 'unemployed_seeking' },
        helpText: 'If yes, you may be eligible for COBRA continuation coverage.',
      },
      {
        id: 'receivingUnemploymentBenefits',
        label: 'Are you currently receiving unemployment benefits?',
        type: 'toggle',
        required: false,
        showWhen: { field: 'employmentStatus', value: 'unemployed_seeking' },
        helpText: 'Unemployment income counts toward ACA subsidy calculations.',
      },
      {
        id: 'onCOBRA',
        label: 'Are you currently on COBRA continuation coverage?',
        type: 'toggle',
        required: false,
        showWhen: { field: 'employmentStatus', value: 'unemployed_seeking' },
      },
      {
        id: 'cobraMonthsRemaining',
        label: 'How many months of COBRA do you have remaining?',
        type: 'number',
        placeholder: 'e.g. 14',
        required: false,
        showWhen: { field: 'onCOBRA', value: true },
        helpText: 'COBRA lasts up to 18 months. Knowing when it ends helps us plan your transition.',
      },

      // ── Unemployed not seeking ──
      {
        id: 'formerEmployerInsurance',
        label: 'Did your most recent job offer health insurance?',
        type: 'toggle',
        required: false,
        showWhen: { field: 'employmentStatus', value: 'unemployed_not_seeking' },
        helpText: 'If yes, you may still be eligible for COBRA.',
      },

      // ── Retired ──
      {
        id: 'retiredWithBenefits',
        label: 'Do you receive retiree health benefits from a former employer?',
        type: 'toggle',
        required: false,
        showWhen: { field: 'employmentStatus', value: 'retired' },
      },
    ],
  },

  // ── STEP 4: Student details (shown if student or F-1/J-1) ─────────────────
  {
    id: 'student_details',
    title: 'Tell us about your school',
    subtitle: 'University enrollment determines whether a school health plan is an option — and when to enroll.',
    showWhen: { field: 'isStudentOrVisa', values: [true] },
    fields: [
      {
        id: 'isStudent',
        label: 'Are you currently enrolled at a US college or university?',
        type: 'toggle',
        required: true,
        helpText: 'Enrollment gives you access to a Student Health Insurance Plan (SHIP).',
      },
      {
        id: 'university',
        label: 'Which school do you attend?',
        type: 'text',
        placeholder: 'e.g. University of Michigan, NYU, Stanford',
        required: false,
        showWhen: { field: 'isStudent', value: true },
        helpText: "We'll use this to look up enrollment deadlines and waiver requirements for your school.",
      },
      {
        id: 'schoolRequiresInsurance',
        label: 'Does your school require health insurance?',
        type: 'toggle',
        required: false,
        showWhen: { field: 'isStudent', value: true },
        helpText: 'Most schools require it for international students. Check your student portal or DSO.',
      },
      {
        id: 'yearsLeftInCollege',
        label: 'How many years do you have left in your program?',
        type: 'select',
        required: false,
        showWhen: { field: 'isStudent', value: true },
        options: [
          { value: 'less_than_1', label: 'Less than 1 year', description: 'Graduating this academic year' },
          { value: '1_to_2', label: '1–2 years', description: 'Upper classman or master\'s student' },
          { value: '2_to_4', label: '2–4 years', description: 'Midway through undergrad or PhD' },
          { value: '4_plus', label: '4+ years', description: 'Just starting or long doctoral program' },
        ],
      },
    ],
  },

  // ── STEP 5: Household & finances ───────────────────────────────────────────
  {
    id: 'household',
    title: 'Your household and finances',
    subtitle: 'Household size and income determine eligibility for subsidies, Medicaid, and cost-sharing reductions.',
    fields: [
      {
        id: 'age',
        label: 'Your age',
        type: 'number',
        placeholder: 'e.g. 28',
        required: true,
        helpText: 'Used to check Medicare eligibility (65+) and dependent coverage rules.',
      },
      {
        id: 'householdSize',
        label: 'Household size',
        type: 'number',
        placeholder: 'e.g. 2',
        required: true,
        helpText: 'Count yourself plus anyone you claim on your tax return (spouse, children, dependents).',
      },
      {
        id: 'annualIncome',
        label: 'Estimated annual household income (USD)',
        type: 'number',
        placeholder: 'e.g. 45000',
        required: true,
        helpText: 'Use your best estimate before taxes. This calculates subsidy eligibility — it is not stored or shared.',
      },
      {
        id: 'filingStatus',
        label: 'Tax filing status',
        type: 'select',
        required: false,
        helpText: 'Used to more accurately estimate ACA Premium Tax Credit eligibility.',
        options: [
          { value: 'single', label: 'Single' },
          { value: 'married_joint', label: 'Married, filing jointly' },
          { value: 'married_separate', label: 'Married, filing separately' },
          { value: 'head_of_household', label: 'Head of household' },
        ],
      },
      {
        id: 'hasDependents',
        label: 'Do you have dependents (children or other dependents)?',
        type: 'toggle',
        required: false,
        helpText: 'This affects CHIP eligibility and household size calculations.',
      },
    ],
  },

  // ── STEP 6: Healthcare usage — for cost estimator ──────────────────────────
  {
    id: 'health_usage',
    title: 'Your health and coverage needs',
    subtitle: "These questions let us estimate your real annual costs across different plan types — not just the premium.",
    fields: [
      {
        id: 'expectedHealthcareUsage',
        label: 'How would you describe your expected healthcare needs this year?',
        type: 'select',
        required: false,
        options: [
          { value: 'minimal', label: 'Minimal — mostly healthy', description: 'Annual checkups, rarely need care' },
          { value: 'moderate', label: 'Moderate — occasional visits', description: 'A few doctor visits or prescriptions per year' },
          { value: 'high', label: 'High — frequent or ongoing care', description: 'Chronic conditions, regular prescriptions, or procedures planned' },
        ],
      },
      {
        id: 'takesRegularMedications',
        label: 'Do you take regular prescription medications?',
        type: 'toggle',
        required: false,
        helpText: "Plan formularies (drug coverage lists) vary widely. This affects which plan's drug coverage tier matters most.",
      },
      {
        id: 'numberOfPrescriptions',
        label: 'Roughly how many different prescription medications do you take?',
        type: 'number',
        placeholder: 'e.g. 2',
        required: false,
        showWhen: { field: 'takesRegularMedications', value: true },
        helpText: 'Even an approximate number helps estimate formulary costs.',
      },
      {
        id: 'hasChronicConditions',
        label: 'Do you have any chronic or ongoing health conditions?',
        type: 'toggle',
        required: false,
        helpText: 'e.g. diabetes, asthma, hypertension, mental health conditions. ACA plans cannot deny coverage for pre-existing conditions.',
      },
      {
        id: 'chronicConditionList',
        label: 'Which conditions? (optional — helps with plan matching)',
        type: 'text',
        placeholder: 'e.g. Type 2 diabetes, asthma',
        required: false,
        showWhen: { field: 'hasChronicConditions', value: true },
        helpText: 'This is only used to improve your plan recommendations. It is not stored.',
      },
      {
        id: 'expectedProcedures',
        label: 'Any planned procedures or specialist visits in the next 12 months?',
        type: 'text',
        placeholder: 'e.g. knee surgery, dermatologist, therapy',
        required: false,
        helpText: "Helps us estimate out-of-pocket costs more accurately across plan tiers.",
      },
      {
        id: 'preferredDoctors',
        label: 'Do you have a preferred doctor or specialist you want to keep?',
        type: 'text',
        placeholder: 'e.g. Dr. Smith at UPMC, Children\'s Hospital',
        required: false,
        helpText: "We'll flag if your doctor may be out-of-network on certain plan types.",
      },
      {
        id: 'monthlyPremiumBudget',
        label: 'What is your maximum monthly budget for premiums? (USD)',
        type: 'number',
        placeholder: 'e.g. 200',
        required: false,
        helpText: "We'll filter and rank plans to show options within your budget range.",
      },
    ],
  },

  // ── STEP 6b: Benefit priorities ────────────────────────────────────────────
  {
    id: 'benefit_priorities',
    title: 'What benefits matter most to you?',
    subtitle: 'Select everything that applies. We\'ll use this to score and rank plans based on what you actually care about.',
    fields: [
      {
        id: 'benefitPriorities',
        label: 'Select all that are important to you',
        type: 'multiselect',
        required: false,
        helpText: 'Not all plans cover these — your selections help us filter and score plans.',
        options: [
          { value: 'prescriptions',     label: '💊 Prescription drugs',     description: 'Good formulary coverage for medications' },
          { value: 'mental_health',     label: '🧠 Mental health',          description: 'Therapy, psychiatry, counseling' },
          { value: 'dental',            label: '🦷 Dental coverage',        description: 'Cleanings, fillings, major dental work' },
          { value: 'vision',            label: '👁️ Vision coverage',        description: 'Eye exams, glasses, contacts' },
          { value: 'hearing',           label: '👂 Hearing coverage',       description: 'Hearing tests and aids' },
          { value: 'maternity',         label: '🤱 Maternity / newborn',    description: 'Prenatal, labor, delivery, newborn care' },
          { value: 'specialist_access', label: '🏥 Specialist access',      description: 'No referral needed, broad PPO network' },
          { value: 'emergency_care',    label: '🚑 Emergency care',         description: 'Good ER and urgent care coverage' },
          { value: 'fitness',           label: '🏋️ Fitness / gym benefits', description: 'Gym membership or fitness reimbursement' },
          { value: 'transportation',    label: '🚗 Transportation',         description: 'Rides to medical appointments' },
          { value: 'over_the_counter',  label: '🛒 Over-the-counter items', description: 'OTC drugs, supplies covered' },
        ],
      },
      {
        id: 'hospitalVisitFrequency',
        label: 'How often do you typically visit a hospital or ER?',
        type: 'select',
        required: false,
        helpText: 'Helps us weight plans with better inpatient / ER coverage if you need it.',
        options: [
          { value: 'never',           label: 'Never or almost never',    description: 'I avoid hospitals unless absolutely necessary' },
          { value: '1_to_2_per_year', label: '1–2 times per year',       description: 'Occasional ER or hospital stay' },
          { value: 'monthly',         label: 'Monthly',                  description: 'Regular hospital appointments or treatments' },
          { value: 'regularly',       label: 'Regularly / ongoing',      description: 'Frequent inpatient or specialty hospital care' },
        ],
      },
      {
        id: 'specificHealthConcerns',
        label: 'Any specific health areas you want well-covered? (optional)',
        type: 'multiselect',
        required: false,
        helpText: 'Select all that apply — we\'ll flag how each plan handles these.',
        options: [
          { value: 'diabetes',          label: 'Diabetes management' },
          { value: 'heart',             label: 'Cardiovascular / heart' },
          { value: 'cancer',            label: 'Cancer care / oncology' },
          { value: 'asthma_copd',       label: 'Asthma / COPD' },
          { value: 'orthopedic',        label: 'Orthopedic / joint / back' },
          { value: 'pregnancy',         label: 'Pregnancy / reproductive health' },
          { value: 'pediatric',         label: 'Pediatric / child health' },
          { value: 'substance_use',     label: 'Substance use treatment' },
          { value: 'rare_disease',      label: 'Rare or complex condition' },
        ],
      },
      {
        id: 'zipCode',
        label: 'Your ZIP code',
        type: 'text',
        placeholder: 'e.g. 15213',
        required: false,
        helpText: 'Used to find real insurance plans available in your area. Not stored beyond this session.',
      },
    ],
  },

  // ── STEP 7: Current coverage ────────────────────────────────────────────────
  {
    id: 'current_coverage',
    title: 'Current coverage status',
    subtitle: 'A few final questions about your current insurance situation.',
    fields: [
      {
        id: 'currentlyInsured',
        label: 'Do you currently have health insurance?',
        type: 'toggle',
        required: true,
      },
      {
        id: 'currentPlanType',
        label: 'What type of plan do you have?',
        type: 'select',
        required: false,
        showWhen: { field: 'currentlyInsured', value: true },
        options: [
          { value: 'employer', label: 'Employer-sponsored' },
          { value: 'aca_marketplace', label: 'ACA marketplace plan' },
          { value: 'medicaid', label: 'Medicaid' },
          { value: 'medicare', label: 'Medicare' },
          { value: 'school_plan', label: 'University / school plan' },
          { value: 'isp', label: 'International student plan (ISP)' },
          { value: 'cobra', label: 'COBRA' },
          { value: 'short_term', label: 'Short-term plan' },
          { value: 'other', label: 'Other' },
        ],
      },
    ],
  },
]

// Helper: determine which steps to show based on current profile state
export function getVisibleSteps(profile: Record<string, unknown>): OnboardingStep[] {
  const studentVisaStatuses = ['f1_student', 'f1_opt', 'j1_scholar', 'j2']
  const isStudentVisa = studentVisaStatuses.includes(profile.immigrationStatus as string)
  const isStudentEmployment = profile.employmentStatus === 'student'
  const isStudentToggled = profile.isStudent === true

  return ONBOARDING_STEPS.filter(step => {
    if (step.id === 'student_details') {
      // Show student step if on a student visa OR if employment is 'student' OR if they said yes to student toggle
      return isStudentVisa || isStudentEmployment || isStudentToggled
    }
    return true
  })
}
