// 2025 HHS Poverty Guidelines — used for 2026 plan year ACA eligibility calculations.
// Single source of truth: update this file each year, not the callers.
// Source: https://aspe.hhs.gov/poverty-guidelines
export const FPL_BASE: Record<number, number> = {
  1: 15650, 2: 21150, 3: 26650, 4: 32150,
  5: 37650, 6: 43150, 7: 48650, 8: 54150,
}

const FPL_PER_ADDITIONAL = 5500

export function getFPLPercent(income: number, householdSize: number): number {
  const base = FPL_BASE[Math.min(householdSize, 8)] ?? (FPL_BASE[8] + (householdSize - 8) * FPL_PER_ADDITIONAL)
  return (income / base) * 100
}
