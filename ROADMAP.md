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

### Task 3 — Verify ACA recommendations `todo`
Manually check subsidy math against healthcare.gov for at least 10 user scenarios covering different income levels, household sizes, and states. Document results. Fix any discrepancies found.

### Task 4 — Add trust signals everywhere `todo`
Every recommendation screen needs: a disclaimer that this is not legal or insurance advice, source citations for the eligibility rules shown, and a "verify on healthcare.gov" link. No recommendation should be shown without these.

### Task 5 — Do 5 real user tests `todo`
Find 5 actual immigrants or visa holders. Watch them go through the full flow live — do not help them. Note every point of confusion, every wrong assumption, every place they get stuck. This is the most important task in Phase 1. Nothing replaces it.

---

## Phase 2 — Close the Critical Gaps

**Do not start Phase 2 until Phase 1 is fully complete.**
**Phase 2 is complete only when all 5 tasks are done.**

### Task 1 — Restructure the appeal assistant `todo`
The current implementation drafts generic letters. Generic letters don't work for insurance denials. When a user uploads a denial letter, Claude should extract the specific denial code, the plan's stated reason, and the relevant policy language — then draft a letter that cites those specifics. The output must reference the actual EOB or denial document, not boilerplate.

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
