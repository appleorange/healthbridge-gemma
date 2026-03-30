# HealthBridge Testing

## Current State: NO TESTS CONFIGURED

`package.json` test script:
```json
"test": "echo \"Error: no test specified\" && exit 1"
```

- No test framework installed (no Jest, Vitest, Testing Library, Playwright)
- No `.test.ts` / `.spec.ts` files anywhere in the repository
- No test configuration files
- No CI/CD pipeline (no `.github/workflows/`, no Dockerfile)

**100% of code is untested.** Only manual browser testing is currently possible.

---

## Untested Areas (Everything)

- All components: rendering, state, event handling, conditional rendering
- All API routes: `app/api/chat`, `app/api/eligibility`, `app/api/plans`, `app/api/appeal/analyze`, `app/api/appeal/draft`, `app/api/documents/parse`, `app/api/timeline/generate`, `app/api/network-check`
- All lib functions: `lib/eligibility/engine.ts`, `lib/calculators/cost-estimator.ts`, `lib/plans/plan-finder.ts`, `lib/prompts/system.ts`
- All error handling paths and edge cases

---

## Manual Testing Guide

### Setup
```bash
npm install && npm run dev
# App at http://localhost:3000
```

### Key Flows to Verify

**Onboarding → Dashboard**
1. `/` → click "Get started"
2. Complete 5-step form; verify conditional fields appear/disappear
3. Final submit → POST `/api/eligibility` → redirect `/dashboard`
4. Check sessionStorage: `hb_profile`, `hb_eligibility`

**Chat (Tools tab)**
- Send messages; verify streaming response
- Hit 20-message limit → verify block message appears
- Clear history → verify sessionStorage reset

**Documents (Tools tab)**
- Upload PDF/image → POST `/api/documents/parse`
- Verify extracted fields and deadlines render
- Upload 4th document → verify limit error

**Appeal Assistant**
- Enter denial info → POST `/api/appeal/analyze`
- Generate letter → POST `/api/appeal/draft` (streaming)
- Attempt 3rd appeal → verify limit error

**Plan Explorer**
- Verify fit score rings animate
- Toggle plan comparison → side-by-side view
- Network checker → POST `/api/network-check`

### sessionStorage Keys to Inspect
| Key | Content |
|-----|---------|
| `hb_profile` | Full `UserProfile` JSON |
| `hb_eligibility` | Full `EligibilityResult` JSON |
| `hb_chat_messages` | Array of `ChatMessage` |
| `hb_message_count` | Integer (limit: 20) |
| `hb_doc_count` | Integer (limit: 3) |
| `hb_appeal_count` | Integer (limit: 2) |

### Edge Cases
- Stop network mid-stream → verify graceful degradation
- Return malformed JSON from API → verify fallback handling
- Open DevTools console → no uncaught promise rejections
- Responsive: 375px mobile, 768px tablet, 1024px+ desktop

---

## Recommended Setup (Not Yet Implemented)

### Unit Tests
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest
```

Priority targets (pure functions first):
1. `lib/eligibility/engine.ts` — FPL calculations, eligibility rules
2. `lib/calculators/cost-estimator.ts` — cost math
3. `lib/plans/plan-finder.ts` — fit score logic
4. API route error handling (all 8 routes)

### E2E Tests
```bash
npm install --save-dev playwright
```

Key scenarios: full onboarding flow, chat with mocked API, document upload, navigation.

### CI/CD
Create `.github/workflows/test.yml` — run type checking, unit tests, E2E tests on push.
