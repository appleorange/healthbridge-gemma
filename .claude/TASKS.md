# HealthBridge — Task Tracker

## Done ✅

### v1.1 UI Overhaul (complete)
- [x] Lenis smooth scroll provider with route reset + mobile disable
- [x] Design tokens (surface, radius, shadow, motion) in globals.css
- [x] Landing page extracted into 6 section components + scroll reveals
- [x] Hero: animated stats (CountUp) + cycling product demo screenshots
- [x] Dashboard sidebar nav replacing tab bar (mobile Sheet drawer included)
- [x] Dashboard home overview: recommendation + deadline + cost estimate
- [x] Onboarding: AnimatedField stagger animations + directional StepTransition

### Eligibility Engine Audit & Fixes (complete)
- [x] Documented current engine rules as status × program matrix
- [x] Extracted all policy constants into `lib/eligibility/rules.ts`
- [x] **Bug 2 fixed:** LPR 5-year bar implemented (`yearsAsLPR` now used; waiver states list added)
- [x] **Bug 1+3 fixed:** H-1B, H-4, F-1, J-1, J-2 now have ACA marketplace access (lawfully present)
- [x] **Bug 4 fixed:** J-2 removed from `isInternationalStudentVisa` — routes to marketplace instead of SHIP/ISP
- [x] **Bug 7 fixed:** Medicare evaluated for age 65+ with qualifying status
- [x] **DACA+CA fixed:** Covered California (state exchange) surfaced for DACA in California
- [x] **Bug 8 partial:** TPS and humanitarian parolee added as selectable statuses with correct routing
- [x] **Bug 9 fixed:** Short-term plans only surface when no comprehensive option exists

### Security & Correctness Pass (complete 2026-04-28)
- [x] **L-1/O-1/TN APTC verified:** Eligible through Dec 31, 2026 (KFF/NILC confirmed). 2027 restriction documented in `rules.ts` with TODO.
- [x] **FPL centralized:** Created `lib/constants/fpl.ts` — single 2025 HHS figures. Both `engine.ts` (was 2024) and `cost-estimator.ts` now import from it.
- [x] **Zod validation:** Installed Zod, created `lib/validation/schemas.ts` with `UserProfileSchema` + 7 per-route schemas. All 8 API routes validate at boundary before business logic.
- [x] **appeal/draft error handling:** Added missing try/catch wrapper.
- [x] **documents/parse FPL:** Replaced hardcoded `15060` with `getFPLPercent()` call.

---

## In Progress 🔄

*(none)*

---

## Next 5 Priority Tasks

### 1. CHIP eligibility for children in mixed-status households
**File:** `lib/eligibility/engine.ts`
**Action:** Add CHIP to eligible plans when `profile.hasDependents === true`. Children who are US citizens are CHIP/Medicaid eligible regardless of parents' status. Requires adding a child citizenship question to onboarding.
**Why it matters:** Highest-impact missing program; CHIP already exists in `PlanType` but is never evaluated.

### 2. 2027 APTC restriction — implement before Jan 1, 2027
**File:** `lib/eligibility/rules.ts` — `APTC_ELIGIBLE_STATUSES` + engine.ts subsidy logic
**Action:** Split `APTC_ELIGIBLE_STATUSES` from `MARKETPLACE_ACCESS_STATUSES`. After 2027, only LPRs, US citizens, Cuban-Haitian entrants, and COFA citizens get APTC. All non-immigrant visa holders (H-1B, H-4, F-1, L-1, O-1, TN, J-1, TPS, parolees, refugees without green cards) lose APTC. Add a date gate. See big comment in `rules.ts`.
**Why it matters:** Without this change, the engine will incorrectly show subsidy eligibility to ~1.4 million people starting 2027.

### 3. Centralize Anthropic client + shared utilities
**Files:** `app/api/chat`, `documents/parse`, `timeline/generate`, `appeal/analyze`, `appeal/draft`, `network-check`
**Action:** Create `lib/api/anthropic.ts` with singleton client, `extractJSON()` helper, and `createStream()` wrapper. Replace 6 inline `new Anthropic()` calls.
**Why it matters:** JSON extraction pattern duplicated 4+ times; error handling inconsistent. See CONCERNS.md §3.1.

### 4. Add prompt injection mitigations to Claude-backed routes
**Files:** `app/api/appeal/analyze`, `app/api/appeal/draft`, `app/api/network-check`
**Action:** Wrap user-supplied fields in XML delimiter tags (e.g. `<plan_name>…</plan_name>`) before interpolating into Claude prompts. See CONCERNS.md §1.4.
**Why it matters:** Even with Zod validation, raw string content can include adversarial instructions. XML delimiters are the recommended mitigation.

### 5. Add `// last verified: YYYY-MM-DD` timestamps to all state lists in `rules.ts`
**File:** `lib/eligibility/rules.ts`
**Action:** Add verification dates so future maintainers know when each list was last confirmed.

---

## Backlog (after priority tasks)

- [ ] Emergency Medicaid option for undocumented users (add to `eligible` plans, not just explanation text)
- [ ] DACA state exchange list expansion — check if other states have followed CA (WA, IL may be next)
- [ ] Build and run the full 25-case test matrix from the eligibility audit
- [ ] Add `// last verified: YYYY-MM-DD` timestamps to all state lists in `rules.ts`
- [ ] Remove hardcoded CMS Healthcare.gov fallback API key (see CONCERNS.md §1.2)
- [ ] Add fetch timeouts (`AbortSignal.timeout(10000)`) to all client-side fetches
- [ ] AI disclaimer banners on chat and appeal assistant (CONCERNS.md §4.4)
- [ ] Cache Healthcare.gov plan responses by ZIP code (24hr TTL)
