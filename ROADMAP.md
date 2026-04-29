# HealthBridge Roadmap

## MVP Bar
HealthBridge is an MVP when: 5 real immigrant or visa holder users can go through the full flow and come out either understanding their options clearly, or actually enrolling in a plan. Everything in Phase 1 and Phase 2 serves that bar. Nothing in Phase 3 does.

---

## Phase 1 — Validate What You Have

**Phase 1 is complete only when all 5 tasks are done.**
**Do not start Phase 2 until Phase 1 is fully complete.**

### Task 1 — Audit the eligibility engine `✅ done`
Fixed 7 bugs in `lib/eligibility/engine.ts` (5-year bar, H-1B/H-4/F-1/J-1 marketplace access, J-2 routing, Medicare age check, DACA+CA state exchange, TPS/parolee statuses, short-term plan tightening). Created `lib/eligibility/rules.ts` to hold all policy constants. Built a 25-case test matrix — all cases pass except 3 pending external verification (covered in Task 2).

### Task 2 — Complete the eligibility audit `todo`
Three items remaining:

- **2a.** Verify L-1/O-1/TN APTC eligibility on kff.org immigrant eligibility fact sheet — update `rules.ts` based on findings. **Blocker before engine goes live.**
- **2b.** Verify `DACA_STATE_MEDICAID_STATES` list in `rules.ts` against NILC guide at nilc.org — state legislation has changed recently.
- **2c.** Fix FPL year mismatch — create `lib/constants/fpl.ts` as single source of truth, update both `lib/eligibility/engine.ts` and `lib/calculators/cost-estimator.ts` to import from it.

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

### Task 3 — Add Zod validation to all API routes `todo`
All 8 API routes currently accept arbitrary JSON. Add Zod schemas to each. Prioritize routes that feed into Claude prompts or handle income/immigration status data — those are highest risk for prompt injection and data integrity issues.

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

## Change Log

| Date | Task | Status change | Notes |
|------|------|--------------|-------|
| — | Phase 1 · Task 1 | → done | 7 engine bugs fixed; rules.ts extracted; 25-case test matrix built |
