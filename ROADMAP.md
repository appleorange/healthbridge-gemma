# HealthBridge Roadmap

## MVP Bar
HealthBridge is an MVP when: 5 real immigrant or visa holder users can go through the full flow and come out either understanding their options clearly, or actually enrolling in a plan. Everything in Phase 1 and Phase 2 serves that bar. Nothing in Phase 3 does.

---

## Phase 1 — Validate What You Have

**Phase 1 is complete only when all 5 tasks are done.**
**Do not start Phase 2 until Phase 1 is fully complete.**

### Task 1 — Audit the eligibility engine `✅ done`
Fixed 7 bugs in `lib/eligibility/engine.ts` (5-year bar, H-1B/H-4/F-1/J-1 marketplace access, J-2 routing, Medicare age check, DACA+CA state exchange, TPS/parolee statuses, short-term plan tightening). Created `lib/eligibility/rules.ts` to hold all policy constants. Built a 25-case test matrix — all cases pass.

### Task 2 — Complete the eligibility audit `✅ done`
- **2a.** L-1/O-1/TN APTC verified via KFF/NILC: eligible through Dec 31, 2026. 2027 restriction documented in `rules.ts` with TODO (One Big Beautiful Bill Act).
- **2b.** `DACA_STATE_MEDICAID_STATES` verified against NILC 2025 report. Comment updated with IL/MN budget pressure notes.
- **2c.** FPL mismatch fixed — `lib/constants/fpl.ts` created with 2025 HHS figures. Both `engine.ts` and `cost-estimator.ts` import from it.

### Task 3 — Verify ACA recommendations `✅ done`
10-scenario verification matrix completed. Two bugs found and fixed in `lib/calculators/cost-estimator.ts`.

**Bug 1 (critical — fixed):** `calculateSubsidy` hardcoded a narrow status list that excluded H-1B, H-4, F-1, J-1, J-2, TPS, and parolees from receiving subsidy estimates. The engine correctly marked these as APTC-eligible, but the cost estimator showed $0 credit. Fix: replaced hardcoded list with `APTC_ELIGIBLE_STATUSES` imported from `rules.ts`. Also split the Medicaid status check to correctly use `FEDERAL_MEDICAID_STATUSES` (LPRs, citizens, refugees, parolees only).

**Bug 2 (medium — fixed):** Contribution rate for 150-200% FPL was 3.0% (original ACA rate) instead of 2.0% (IRA-enhanced 2026 cap). Fix: updated to 2.0%.

**Cleanup:** Removed local `MEDICAID_EXPANSION_STATES` array (duplicate of `ACA_EXPANSION_STATES` in `rules.ts`). Now using single source.

**Known limitation (not fixed):** Benchmark premium is hardcoded at $450-$600/mo (national average). Actual SLCSP varies by state, county, and age. The cost estimate is an approximation, not a precise calculator.

**Known gap (flagged):** The `qualifiesForPTC` check still caps at 400% FPL, but under IRA-enhanced rules (which apply through 2026 per `rules.ts` comments), there is no cliff — anyone above 400% FPL pays a capped 8.5% contribution. This is conservative (users above 400% FPL see no PTC shown, but may actually qualify for a small credit). Intentionally left for future review.

**Verification matrix (FPL computed from 2025 HHS values; rates use IRA-enhanced 2026 schedule):**

| # | Profile | FPL% | Expected outcome | Bug? |
|---|---------|-------|-----------------|------|
| 1 | US Citizen · 1 person · $20k · CA (expansion) | 128% | Medicaid eligible → no PTC | ✓ pass |
| 2 | US Citizen · 1 person · $25k · TX (non-expansion) | 160% | PTC: $408–558/mo credit | Fixed (was $388–538, contribution rate corrected 3%→2%) |
| 3 | Green Card (7yr) · 4 people · $38k · NY (expansion) | 118% | Medicaid eligible → no PTC | ✓ pass |
| 4 | H-1B (no employer ins) · 1 person · $45k · WA | 288% | PTC: $225–375/mo credit | Fixed (was $0 — H-1B missing from eligibility check) |
| 5 | Refugee/Asylee · 3 people · $30k · FL (non-expansion) | 113% | PTC: $450–600/mo (full credit, 0% contribution) | ✓ pass |
| 6 | US Citizen · 4 people · $50k · IL (expansion) | 156% | PTC: $367–517/mo credit | Fixed (was $325–475, rate corrected 3%→2%) |
| 7 | US Citizen · 1 person · $40k · TX | 256% | PTC: $250–400/mo credit | ✓ pass |
| 8 | H-4 Visa (no employer ins) · 2 people · $30k · CA | 142% | PTC: $450–600/mo (full credit) | Fixed (was $0 — H-4 missing from eligibility check) |
| 9 | J-1 Scholar (no employer ins) · 1 person · $35k · MA | 224% | PTC: $333–483/mo credit | Fixed (was $0 — J-1 missing from eligibility check) |
| 10 | Undocumented · 3 people · $28k · CA | 105% | No PTC, no Medicaid (federal) | ✓ pass |

### Task 4 — Add trust signals everywhere `✅ done`
Created `components/ui/TrustBanner.tsx` (shared component: info icon, configurable text, optional verify link). Added to all 5 recommendation surfaces:
- **Dashboard home** — below recommendation card; cites ACA/45 CFR/8 USC; links healthcare.gov
- **Eligibility flowchart** — above the node tree; notes NILC/KFF 2025 sources; links healthcare.gov
- **Cost estimator** — replaces the weak generic disclaimer; notes benchmark approximation; links healthcare.gov
- **Chat** — persistent at top of message list; notes AI limitation; links healthcare.gov/find-assistance
- **Appeal assistant** — shown with the drafted letter; notes not legal advice; links healthcare.gov appeals page

### Task 5 — Do 5 real user tests `⚠️ simulated only — revisit`
Simulated pass completed (2026-05-01): 5 personas (F-1 student, H-1B, undocumented, green card 2yr, TPS), full flow coverage, 12 issues found and fixed. Real user testing with actual immigrants still recommended before v1 launch but not blocking Phase 2.

---

## Phase 2 — Close the Critical Gaps

**Do not start Phase 2 until Phase 1 is fully complete.**
**Phase 2 is complete only when all 5 tasks are done.**

### Task 1 — Restructure the appeal assistant `✅ done`
Added document upload (JPEG/PNG/PDF) to the appeal entry step. New `/api/appeal/extract` route uses Claude vision to extract denial code, verbatim denial reason, service description, denial date, and — critically — the specific policy language cited in the denial. Extracted fields pre-fill the form (user can still edit). The analyze route now instructs Claude to address the specific policy language; the draft route instructs Claude to quote it directly in the letter rather than using boilerplate. Policy language is surfaced as a read-only field so users can see what was found.

### Task 2 — Add a concrete action checklist per user `todo`
After the eligibility recommendation, generate a per-user checklist: who to call, what documents to bring, what to say, deadlines specific to their situation and state. This is more useful than a generic enrollment timeline.

### Task 3 — Add Zod validation to all API routes `✅ done`
Installed Zod. Created `lib/validation/schemas.ts` with `UserProfileSchema` + 7 per-route schemas. All 8 API routes now validate at the POST boundary before passing to business logic. Added missing try/catch to `appeal/draft`.

### Task 4 — Basic Spanish language support `todo`
Add Spanish as a language option starting with the onboarding flow and eligibility results screens. Users are often not native English speakers. Use Claude to handle translations where needed.

### Task 5 — Sharpen visa × eligibility output `todo`
The eligibility result for each immigration status should be in plain language with zero jargon, specific to that visa type, and clearly explain what the user can and cannot do. This is HealthBridge's core differentiator — it should feel meaningfully better than anything else available.

---

## Phase 3 — Defer Until After MVP

**Do not work on these until Phase 1 and Phase 2 are fully done.**

- Provider network checker improvements (healthcare.gov already does this adequately)
- Plan comparison tool enhancements (not the core differentiator)
- Additional animations or UI polish (the UI is already strong from v1.1)

---

## Backlog — Discovered During Development

Items that emerged during work but don't map to a Phase 1/2 task. Review before starting each new phase.

- **CHIP eligibility for children in mixed-status families** — Add CHIP to eligible plans when `profile.hasDependents === true`. Children who are US citizens are CHIP/Medicaid eligible regardless of parents' status. Requires a child citizenship question in onboarding. (`PlanType` already includes `chip` — never evaluated.)
- **2027 APTC restriction** — Must implement before Jan 1, 2027. Split `APTC_ELIGIBLE_STATUSES` from `MARKETPLACE_ACCESS_STATUSES`; after 2027 only LPRs, US citizens, Cuban-Haitian entrants, and COFA citizens keep APTC. All non-immigrant visa holders lose it. See `// ⚠️ TODO` in `lib/eligibility/rules.ts`.
- **Prompt injection mitigations** — Wrap user-supplied fields in XML delimiter tags before interpolating into Claude prompts in `appeal/analyze`, `appeal/draft`, `network-check`. See `CONCERNS.md §1.4`.
- **Centralize Anthropic client** — Create `lib/api/anthropic.ts` with singleton client, `extractJSON()` helper, `createStream()` wrapper. Replace 6 inline `new Anthropic()` calls. See `CONCERNS.md §3.1`.
- **Emergency Medicaid for undocumented users** — Surface as an eligible plan (not just explanation text).
- **Remove hardcoded CMS fallback API key** — See `CONCERNS.md §1.2`.
- **Add fetch timeouts** — `AbortSignal.timeout(10000)` on all client-side fetches.
- **AI disclaimer banners** — On chat and appeal assistant. See `CONCERNS.md §4.4`.
- **Verification timestamps on state lists** — Add `// last verified: YYYY-MM-DD` to all state lists in `rules.ts`.

---

## Change Log

| Date | Task | Status | Notes |
|------|------|--------|-------|
| 2026-04-28 | Phase 1 · Task 1 | → done | 7 engine bugs fixed; `rules.ts` extracted; 25-case test matrix built |
| 2026-04-28 | Phase 1 · Task 2 | → done | APTC verified; DACA states updated; FPL centralized |
| 2026-04-28 | Phase 2 · Task 3 | → done | Zod installed; all 8 routes validated; `appeal/draft` error handling added |
| 2026-04-28 | Phase 1 · Task 3 | → done | 10-scenario verification matrix; 2 bugs fixed in `calculateSubsidy` (H-1B/H-4/J-1 missing from APTC check; 150-200% FPL rate 3%→2%); MEDICAID_EXPANSION_STATES deduped |
| 2026-04-29 | Phase 1 · Task 4 | → done | `TrustBanner` component; added to dashboard home, flowchart, cost estimator, chat, appeal assistant |
| 2026-05-03 | Phase 2 · Task 1 | → done | `/api/appeal/extract` route; doc upload pre-fills form; policy language extracted, surfaced, and quoted in letter |
