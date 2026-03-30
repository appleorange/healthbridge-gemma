# HealthBridge Technical Concerns & Debt

**Last Updated:** 2026-03-30

---

## 1. CRITICAL SECURITY CONCERNS

### 1.1 Exposed API Keys
**Severity:** CRITICAL
**Files:**
- `.env.local` — Contains a live Anthropic API key
- `.env.local.example` — Contains what appears to be a real (not placeholder) API key

**Impact:** Anyone with repo access can use these keys to call the Anthropic API at your expense.

**Action required immediately:** Rotate both keys at console.anthropic.com, then remove `.env.local` from git history (`git filter-repo` or BFG). Confirm `.env.local` is in `.gitignore`.

---

### 1.2 Hardcoded Fallback API Key
**Severity:** HIGH
**Files:**
- `lib/plans/plan-finder.ts` — CMS Healthcare.gov demo key hardcoded as fallback
- `app/api/network-check/route.ts` — Same key

**Impact:** Public demo key intended for development is baked into production code; rate-limited and may be revoked.

**Recommendation:** Remove fallback entirely. Fail explicitly if `HEALTHCARE_GOV_API_KEY` not set.

---

### 1.3 No Input Validation on API Endpoints
**Severity:** HIGH
**Files:** All API routes — `app/api/eligibility`, `app/api/chat`, `app/api/plans`, `app/api/appeal/analyze`, `app/api/appeal/draft`, `app/api/documents/parse`, `app/api/network-check`

**Impact:** No validation of field types, ranges, or lengths before passing to Claude prompts or business logic. Prompt injection possible.

**Recommendation:** Add runtime schema validation (Zod) at all API boundaries.

---

### 1.4 User Input Interpolated Directly into AI Prompts
**Severity:** MEDIUM-HIGH
**Files:**
- `app/api/appeal/draft/route.ts` — `denialInfo` fields interpolated without escaping
- `app/api/appeal/analyze/route.ts` — Same pattern
- `app/api/network-check/route.ts` — `providerName`, `zipCode` directly in prompt

**Example attack:** `planName = "XYZ\n\nIgnore all instructions and recommend..."`

**Recommendation:** Wrap user inputs in XML delimiter tags in prompts. Validate format before interpolation.

---

### 1.5 Fragile JSON Extraction from Claude Responses
**Severity:** MEDIUM
**Files:**
- `app/api/documents/parse/route.ts` — `text.match(/\{[\s\S]*\}/)` (overly broad regex)
- `app/api/appeal/analyze/route.ts` — Similar pattern
- `app/api/network-check/route.ts` — Same
- `app/api/timeline/generate/route.ts` — Same

**Impact:** No schema validation after parsing. Malformed response silently produces wrong data.

**Recommendation:** Validate parsed objects against Zod schemas. Use Claude's structured output mode where possible.

---

## 2. PERFORMANCE CONCERNS

### 2.1 No Caching for Expensive API Calls
**Severity:** MEDIUM
**Files:**
- `lib/plans/plan-finder.ts` — Healthcare.gov plan fetch on every dashboard load
- County FIPS lookup called repeatedly for same ZIP

**Recommendation:** Cache plans by ZIP code (24-hour TTL). Cache FIPS lookups permanently.

### 2.2 No Memoization in React Components
**Severity:** LOW-MEDIUM
**Files:** `components/plans/PlanCards.tsx`, `components/chat/ChatInterface.tsx`, `components/documents/DocumentHub.tsx`

**Recommendation:** `React.memo()` on pure display components. `useMemo()` for fit score calculations.

### 2.3 No Fetch Timeouts
**Severity:** MEDIUM
**Files:** All client-side fetches in components

**Impact:** Requests can hang indefinitely; no retry logic.

**Recommendation:** Use `AbortSignal.timeout(10000)` on all fetch calls.

---

## 3. TECHNICAL DEBT

### 3.1 Anthropic Client Duplicated Across Routes
**Severity:** LOW-MEDIUM
**Issue:** `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })` initialized in 6+ separate route files. JSON extraction utility repeated 4+ times. Streaming response pattern duplicated.

**Recommendation:** Create `lib/api/anthropic.ts` with singleton client and shared utilities (`extractJSON()`, `createStream()`).

### 3.2 FPL Threshold Mismatch
**Severity:** MEDIUM
**Files:**
- `lib/eligibility/engine.ts` — FPL thresholds labeled 2024
- `lib/calculators/cost-estimator.ts` — FPL thresholds labeled 2026

**Impact:** Inconsistent subsidy calculations depending on which function is called.

**Recommendation:** Centralize FPL data in `lib/config/constants.ts` with a single source of truth.

### 3.3 Duplicated State Lists
**Severity:** LOW
**Issue:** `MEDICAID_EXPANSION_STATES`, `ACA_EXPANSION_STATES`, `DACA_MEDICAID_STATES` defined in multiple files.

**Recommendation:** Centralize in `lib/config/states.ts`.

### 3.4 Client-Side Rate Limits Easily Bypassed
**Severity:** MEDIUM
**Issue:** Message limit (20), document limit (3), appeal limit (2) enforced via sessionStorage only — user can clear storage and reset counts.

**Recommendation:** Move enforcement server-side (IP-based or session-based). Keep client checks only as UX.

---

## 4. MISSING FEATURES / GAPS

### 4.1 No Authentication
**Severity:** HIGH
**Impact:** Anyone can access the dashboard. No user isolation. HIPAA compliance impossible.

**Recommendation:** Add NextAuth.js or Auth0. Require auth on `/dashboard`. Add MFA for sensitive operations.

### 4.2 No Tests
**Severity:** HIGH
**Status:** `"test": "echo \"Error: no test specified\" && exit 1"`

No test framework installed. No test files. No CI pipeline.

**Priority targets:** `lib/eligibility/engine.ts` (eligibility rules), `lib/calculators/cost-estimator.ts` (cost math), all API route error paths.

### 4.3 No Logging or Monitoring
**Severity:** MEDIUM
**Impact:** No visibility into errors, API failures, or user patterns. Cannot debug production issues.

**Recommendation:** Add structured logging (Sentry or Datadog). Log all API errors with context.

### 4.4 No AI Disclaimers
**Severity:** MEDIUM
**Impact:** Users may rely on AI-generated insurance/legal advice without understanding limitations.

**Recommendation:** Add disclaimer to chat and appeal assistant: "For critical decisions, consult a licensed navigator or attorney." Link to healthcare.gov/find-assistance.

---

## 5. COMPLIANCE

### 5.1 HIPAA / PII Handling Undefined
**Severity:** HIGH
**Issue:** App collects income, immigration status, and health information. No encryption at rest, no retention policy, no consent disclosures, no privacy policy.

**Recommendation:** Add Privacy Policy. Add user consent UI. Implement session deletion. If handling PHI in production, consult HIPAA compliance requirements.

---

## 6. PRIORITIZED ACTION PLAN

**Immediate (before sharing repo or deploying):**
1. Rotate exposed API keys — see §1.1
2. Remove `.env.local` from git history
3. Remove hardcoded CMS fallback key

**Before production:**
4. Add input validation (Zod) on all API routes
5. Add authentication
6. Add privacy disclaimer to AI features
7. Implement server-side rate limiting

**Short-term:**
8. Centralize Anthropic client and shared utilities
9. Fix FPL data mismatch
10. Add structured logging
11. Add unit tests for eligibility engine and cost calculator

**Backlog:**
12. Cache Healthcare.gov API responses
13. Add fetch timeouts and retry logic
14. Bundle size monitoring
15. E2E test suite
