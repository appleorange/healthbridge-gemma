// Eligibility rule constants for health insurance programs by immigration status.
// Extracting these into a config file means policy changes update a list, not engine logic.
//
// Sources: 45 CFR § 155.20 (marketplace), 26 USC § 36B (APTC),
//          8 USC § 1611/1613/1641 (Medicaid), Social Security Act § 1902/1903(v)
//
// State lists marked VERIFY need checking against the current NILC
// "Guide to Immigrant Eligibility for Federal Programs" before each release — they change.

// All valid non-immigrant statuses (8 USC § 1101(a)(15)) are "lawfully present" for
// ACA marketplace and APTC purposes. Source: 45 CFR § 155.20; 26 USC § 36B(c)(1)(B).
// Confirmed via KFF/NILC (2025): L-1, O-1, TN, H-1B, H-4, F-1, J-1, etc. ARE marketplace-
// and APTC-eligible through December 31, 2026.
export const MARKETPLACE_ACCESS_STATUSES: readonly string[] = [
  'us_citizen', 'green_card', 'refugee_asylee',
  'h1b', 'h4', 'l1', 'o1', 'tn',
  'f1_student', 'f1_opt', 'j1_scholar', 'j2',
  'tps', 'parolee',
]

// APTC eligibility uses the same "lawfully present" standard as marketplace access.
// DACA is excluded (federal policy); undocumented is excluded (8 USC § 1611).
//
// ⚠️  TODO: 2027 APTC RESTRICTION — must update before January 1, 2027 ⚠️
// The 2025 Tax and Budget Law ("One Big Beautiful Bill Act") amends 26 USC § 36B to restrict
// APTC eligibility starting January 1, 2027. After that date, ONLY the following groups
// retain APTC eligibility:
//   - US citizens
//   - Lawful Permanent Residents (green card holders)
//   - Cuban-Haitian entrants
//   - COFA citizens (Micronesia, Marshall Islands, Palau)
// ALL other lawfully present immigrants — including H-1B, H-4, F-1, L-1, O-1, TN, J-1,
// TPS holders, refugees/asylees without green cards, and parolees — will lose APTC.
// Estimated 1.4 million immigrants affected (KFF, 2025). Source: Pub. L. 119-XX § XXXX.
// When implementing: split APTC_ELIGIBLE_STATUSES from MARKETPLACE_ACCESS_STATUSES and
// narrow it to only the statuses listed above.
export const APTC_ELIGIBLE_STATUSES: readonly string[] = MARKETPLACE_ACCESS_STATUSES

// Statuses with federal Medicaid access, subject to income and (for LPRs) the 5-year bar.
// Source: 8 USC § 1611; Social Security Act § 1903(v)
// Parolees: humanitarian parolees admitted for 1+ year are qualified aliens (8 USC § 1641(b)(4)).
export const FEDERAL_MEDICAID_STATUSES: readonly string[] = [
  'us_citizen', 'refugee_asylee', 'green_card', 'parolee',
]

// States that fund Medicaid for LPRs during the federal 5-year waiting period using state dollars.
// VERIFY against current NILC guide before shipping — this list changes with state budgets.
// Confirmed: CA, NY, MA, WA. Others below are likely but need current source verification.
export const FIVE_YEAR_BAR_WAIVER_STATES: readonly string[] = [
  'CA', 'CO', 'CT', 'DC', 'IL', 'ME', 'MD', 'MA', 'MN', 'NJ', 'NY', 'OR', 'VT', 'WA',
]

// States with state-funded Medicaid for DACA recipients (adults).
// Verified against NILC "DACA Recipients' Access to Health Care: 2025 Report" (August 2025).
// Adult comprehensive coverage (high confidence): CA, CO, DC, NY, OR, WA
// Adult coverage with known budget pressure: IL (HBIA ended July 2025 for new enrollees),
//   MN (enrollment paused June 2025; coverage ending Jan 2026)
// Children-only / marketplace-only (NOT full Medicaid): CT, MA, MD — retained here for
//   child coverage use cases but engine should note these are limited.
// VERIFY before each release at nilc.org/resources/healthcoveragemaps/
export const DACA_STATE_MEDICAID_STATES: readonly string[] = [
  'CA', 'CO', 'CT', 'DC', 'IL', 'MA', 'MD', 'MN', 'NY', 'OR', 'WA',
]

// States where DACA recipients can access the STATE exchange (not healthcare.gov).
// California extended Covered California to DACA as of January 1, 2023.
export const DACA_STATE_EXCHANGE_STATES: readonly string[] = ['CA']

// States with state-funded Medicaid for TPS holders.
// VERIFY — TPS Medicaid is patchwork; this list is conservative.
export const TPS_STATE_MEDICAID_STATES: readonly string[] = [
  'CA', 'IL', 'MA', 'NY', 'WA',
]

// States with ACA Medicaid expansion (138% FPL threshold vs 100% in non-expansion states).
export const ACA_EXPANSION_STATES: readonly string[] = [
  'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'DE', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SD', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI',
]
