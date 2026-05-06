import type { PlanCard } from '@/types'

type CachedPlan = Omit<PlanCard, 'fitScore' | 'fitReasons' | 'isPrimaryRecommendation'>

const BENEFITS_BRONZE: PlanCard['benefits'] = [
  { label: 'Vision', covered: false }, { label: 'Dental', covered: false },
  { label: 'Mental health', covered: true }, { label: 'Maternity', covered: true },
  { label: 'Prescriptions', covered: true }, { label: 'Fitness', covered: false },
  { label: 'Transportation', covered: false }, { label: 'Over the Counter', covered: false },
]
const BENEFITS_SILVER: PlanCard['benefits'] = [
  { label: 'Vision', covered: false }, { label: 'Dental', covered: false },
  { label: 'Mental health', covered: true }, { label: 'Maternity', covered: true },
  { label: 'Prescriptions', covered: true }, { label: 'Fitness', covered: false },
  { label: 'Transportation', covered: false }, { label: 'Over the Counter', covered: false },
]
const BENEFITS_GOLD: PlanCard['benefits'] = [
  { label: 'Vision', covered: true }, { label: 'Dental', covered: false },
  { label: 'Mental health', covered: true }, { label: 'Maternity', covered: true },
  { label: 'Prescriptions', covered: true }, { label: 'Fitness', covered: false },
  { label: 'Transportation', covered: false }, { label: 'Over the Counter', covered: false },
]

const STATE_PLANS: Record<string, CachedPlan[]> = {
  CA: [
    { id: 'cache_ca_bronze', name: 'Blue Shield Bronze 60 HDHP', issuer: 'Blue Shield of California',
      planType: 'aca_marketplace', networkType: 'PPO', metalTier: 'Bronze',
      monthlyPremium: 387, deductible: 7000, oopMax: 9100, pcpCopay: null, specialistCopay: null,
      benefits: BENEFITS_BRONZE, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
    { id: 'cache_ca_silver', name: 'Oscar Silver Simple PPO', issuer: 'Oscar Health',
      planType: 'aca_marketplace', networkType: 'PPO', metalTier: 'Silver',
      monthlyPremium: 498, deductible: 3500, oopMax: 7000, pcpCopay: 30, specialistCopay: 65,
      benefits: BENEFITS_SILVER, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
    { id: 'cache_ca_gold', name: 'Molina Marketplace Gold', issuer: 'Molina Healthcare',
      planType: 'aca_marketplace', networkType: 'HMO', metalTier: 'Gold',
      monthlyPremium: 589, deductible: 1200, oopMax: 5500, pcpCopay: 20, specialistCopay: 40,
      benefits: BENEFITS_GOLD, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
  ],
  NY: [
    { id: 'cache_ny_bronze', name: 'Empire Bronze Pathway X HMO', issuer: 'Empire BlueCross',
      planType: 'aca_marketplace', networkType: 'HMO', metalTier: 'Bronze',
      monthlyPremium: 412, deductible: 6850, oopMax: 9100, pcpCopay: null, specialistCopay: null,
      benefits: BENEFITS_BRONZE, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
    { id: 'cache_ny_silver', name: 'Oscar Silver Metro PPO', issuer: 'Oscar Health',
      planType: 'aca_marketplace', networkType: 'PPO', metalTier: 'Silver',
      monthlyPremium: 521, deductible: 3200, oopMax: 7000, pcpCopay: 35, specialistCopay: 70,
      benefits: BENEFITS_SILVER, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
    { id: 'cache_ny_gold', name: 'MetroPlus Gold HMO', issuer: 'MetroPlus Health Plan',
      planType: 'aca_marketplace', networkType: 'HMO', metalTier: 'Gold',
      monthlyPremium: 612, deductible: 1000, oopMax: 5000, pcpCopay: 15, specialistCopay: 35,
      benefits: BENEFITS_GOLD, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
  ],
  TX: [
    { id: 'cache_tx_bronze', name: 'BCBS TX Blue Advantage Bronze HMO', issuer: 'Blue Cross Blue Shield of Texas',
      planType: 'aca_marketplace', networkType: 'HMO', metalTier: 'Bronze',
      monthlyPremium: 351, deductible: 7000, oopMax: 9100, pcpCopay: null, specialistCopay: null,
      benefits: BENEFITS_BRONZE, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
    { id: 'cache_tx_silver', name: 'Community First Silver Select HMO', issuer: 'Community First Health Plans',
      planType: 'aca_marketplace', networkType: 'HMO', metalTier: 'Silver',
      monthlyPremium: 447, deductible: 3700, oopMax: 7500, pcpCopay: 30, specialistCopay: 60,
      benefits: BENEFITS_SILVER, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
    { id: 'cache_tx_gold', name: 'Oscar Gold Simple PPO', issuer: 'Oscar Health',
      planType: 'aca_marketplace', networkType: 'PPO', metalTier: 'Gold',
      monthlyPremium: 563, deductible: 1500, oopMax: 5500, pcpCopay: 25, specialistCopay: 50,
      benefits: BENEFITS_GOLD, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
  ],
  FL: [
    { id: 'cache_fl_bronze', name: 'Florida Blue Bronze BlueSelect', issuer: 'Florida Blue',
      planType: 'aca_marketplace', networkType: 'HMO', metalTier: 'Bronze',
      monthlyPremium: 374, deductible: 7000, oopMax: 9100, pcpCopay: null, specialistCopay: null,
      benefits: BENEFITS_BRONZE, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
    { id: 'cache_fl_silver', name: 'Oscar Silver Simple PPO', issuer: 'Oscar Health',
      planType: 'aca_marketplace', networkType: 'PPO', metalTier: 'Silver',
      monthlyPremium: 479, deductible: 3500, oopMax: 7000, pcpCopay: 30, specialistCopay: 65,
      benefits: BENEFITS_SILVER, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
    { id: 'cache_fl_gold', name: 'Molina Gold Plus HMO', issuer: 'Molina Healthcare',
      planType: 'aca_marketplace', networkType: 'HMO', metalTier: 'Gold',
      monthlyPremium: 571, deductible: 1200, oopMax: 5000, pcpCopay: 20, specialistCopay: 45,
      benefits: BENEFITS_GOLD, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
  ],
  WA: [
    { id: 'cache_wa_bronze', name: 'Premera Bronze HDHP PPO', issuer: 'Premera Blue Cross',
      planType: 'aca_marketplace', networkType: 'PPO', metalTier: 'Bronze',
      monthlyPremium: 362, deductible: 6900, oopMax: 9100, pcpCopay: null, specialistCopay: null,
      benefits: BENEFITS_BRONZE, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
    { id: 'cache_wa_silver', name: 'Molina Silver HMO Care', issuer: 'Molina Healthcare',
      planType: 'aca_marketplace', networkType: 'HMO', metalTier: 'Silver',
      monthlyPremium: 461, deductible: 3300, oopMax: 7000, pcpCopay: 25, specialistCopay: 55,
      benefits: BENEFITS_SILVER, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
    { id: 'cache_wa_gold', name: 'Kaiser Gold HMO NW', issuer: 'Kaiser Permanente',
      planType: 'aca_marketplace', networkType: 'HMO', metalTier: 'Gold',
      monthlyPremium: 548, deductible: 1000, oopMax: 4500, pcpCopay: 20, specialistCopay: 40,
      benefits: BENEFITS_GOLD, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
  ],
}

const DEFAULT_PLANS: CachedPlan[] = [
  { id: 'cache_def_bronze', name: 'Marketplace Bronze HDHP Plan', issuer: 'Healthcare.gov',
    planType: 'aca_marketplace', networkType: 'PPO', metalTier: 'Bronze',
    monthlyPremium: 375, deductible: 7000, oopMax: 9100, pcpCopay: null, specialistCopay: null,
    benefits: BENEFITS_BRONZE, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
  { id: 'cache_def_silver', name: 'Marketplace Silver Plan', issuer: 'Healthcare.gov',
    planType: 'aca_marketplace', networkType: 'PPO', metalTier: 'Silver',
    monthlyPremium: 475, deductible: 3500, oopMax: 7000, pcpCopay: 30, specialistCopay: 60,
    benefits: BENEFITS_SILVER, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
  { id: 'cache_def_gold', name: 'Marketplace Gold Plan', issuer: 'Healthcare.gov',
    planType: 'aca_marketplace', networkType: 'PPO', metalTier: 'Gold',
    monthlyPremium: 565, deductible: 1500, oopMax: 5500, pcpCopay: 25, specialistCopay: 50,
    benefits: BENEFITS_GOLD, planUrl: 'https://www.healthcare.gov', isReal: false, year: 2026 },
]

export function getCachedACAPlans(state?: string): CachedPlan[] {
  return STATE_PLANS[state ?? ''] ?? DEFAULT_PLANS
}
