# HealthBridge Gemma — Project Specification

---

## Part 1 — Product Requirements

### Who It's For

Immigrants, visa holders, and undocumented individuals navigating US health insurance eligibility. Specifically:
- H-1B, H-4, L-1, O-1, TN, J-1, J-2 visa holders (employer-sponsored focus)
- F-1 and F-1 OPT students (international student plan focus)
- Green card holders (5-year Medicaid bar navigation)
- DACA and TPS recipients (state-funded program lookup)
- Refugees and asylees (RMA and Medicaid eligibility)
- Undocumented individuals (state programs, CHCs, Emergency Medicaid)

### Problem It Solves

US health insurance eligibility is deeply complex for non-citizens. Existing tools (healthcare.gov, insurance broker sites) assume citizenship. Immigration status determines eligibility in ways that are poorly documented, frequently misunderstood, and change at the state level. A green card holder in their 3rd year in the US, a DACA recipient in California, and an F-1 student transitioning to OPT all have completely different coverage paths — and no mainstream tool explains this clearly.

HealthBridge solves this by running a deterministic, citation-backed eligibility engine over 14+ immigration status categories and then using local AI to explain the results, parse documents, and draft appeals in plain language.

### What It Does (Specific Behaviors)

1. **Multi-step onboarding questionnaire** — collects 40+ profile fields with conditional field visibility based on immigration status, employment, and student status. Example: the "university name" field only appears if `isStudent: true`.

2. **Eligibility engine** — pure TypeScript function `calculateEligibility()` covers 14+ immigration status categories (H-1B, F-1/OPT, J-1, L-1, O-1, TN, green card, DACA, TPS, refugee/asylee, undocumented, parolee, J-2, H-4) with full USC and CFR citations attached to every decision node in the flowchart output.

3. **Plan recommendations** — scores and ranks real ACA plans from the Healthcare.gov CMS API using a 0–100 fit score algorithm that balances premium budget, deductible, benefit priorities, network type, and star ratings. Returns the top 6 plans.

4. **AI-powered features** — all run via local Gemma 4 26B inference through Ollama:
   - Chat assistant: streaming Q&A with full user profile and immigration status context
   - Document parser: vision/multimodal analysis of insurance denial letters and EOBs
   - Appeal letter drafter: streaming plain-text appeal letter with specific citation of denial reason
   - Provider network checker: confirms if a named provider is in-network
   - Enrollment timeline generator: dynamic deadlines based on immigration status and life events
   - Action checklist generator: next steps after eligibility calculation

5. **Fully offline after model download** — no user data is ever transmitted to any external AI service. Ollama runs on localhost. sessionStorage only; no database. Healthcare.gov API is the only external call, with a local JSON cache as offline fallback.

### What It Does NOT Do in v1

- No user accounts or cross-session persistence — sessionStorage clears on tab close; privacy by design
- No real insurance enrollment — navigation and education only
- No mobile app — web-first
- No cross-device sync
- No authentication or HIPAA compliance infrastructure

### Success Metric

A user with H-1B, F-1, DACA, TPS, or undocumented status can complete the full onboarding → eligibility → recommendation → chat flow **with ethernet unplugged** and receive an accurate plan recommendation with correct legal citations.

---

## Part 2 — Engineering Requirements

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14, App Router, TypeScript (strict) |
| Styling | Tailwind CSS v4, Framer Motion, GSAP |
| AI inference | Ollama, `gemma4:26b`, `localhost:11434` |
| External data | Healthcare.gov CMS API (with offline JSON cache fallback) |
| Input validation | Zod on all API route inputs (`lib/validation/schemas.ts`) |
| State | React hooks + sessionStorage (`hb_*` keys) — no database, no Redux |

### Engineering Rules

| Rule | Detail |
|------|--------|
| AI call routing | All AI calls through `lib/ai/client.ts` only — never call Ollama directly from routes or components |
| Prompts | All prompt strings in `lib/prompts/` only — never inline in route files |
| Timeouts | `AbortSignal.timeout(30000)` on every Ollama call — no exceptions |
| Input safety | XML delimiter tags on all user-supplied text interpolated into prompts |
| Validation | Zod schema validation on every API route input before processing |
| Offline fallback | Required for any route that calls Healthcare.gov API |
| Secrets | `OLLAMA_BASE_URL` and `OLLAMA_MODEL` are server-side env vars — never expose to client |
| Types | All shared types in `types/index.ts` — update this file before adding fields elsewhere |
| Imports | Always use `@/` path alias — never relative `../` paths |

### Key Parameters

| Parameter | Value |
|-----------|-------|
| Ollama base URL | `http://localhost:11434` (from `OLLAMA_BASE_URL`) |
| Model | `gemma4:26b` (from `OLLAMA_MODEL`) |
| Request timeout | 30000ms |
| Streaming | `true` for `/api/chat`, `/api/appeal/draft` |
| JSON mode | `true` for `/api/appeal/analyze`, `/api/documents/parse`, `/api/timeline/generate`, `/api/network-check`, `/api/checklist` |
| Max chat messages | 20 per session |
| Max documents | 3 per session |
| Max appeals | 2 per session |

### Session Limits (client-side, sessionStorage)

```
hb_profile          → UserProfile
hb_eligibility      → EligibilityResult
hb_chat_messages    → ChatMessage[]
hb_message_count    → number (limit: 20)
hb_doc_count        → number (limit: 3)
hb_appeal_count     → number (limit: 2)
```

### Ollama API Contract (for `lib/ai/client.ts`)

**Non-streaming (JSON mode):**
```
POST http://localhost:11434/api/chat
{
  model: process.env.OLLAMA_MODEL,
  messages: [{ role: 'system', content: '...' }, { role: 'user', content: '...' }],
  stream: false,
  format: 'json'
}
→ { message: { content: string } }
```

**Streaming:**
```
POST http://localhost:11434/api/chat
{
  model: process.env.OLLAMA_MODEL,
  messages: [...],
  stream: true
}
→ NDJSON stream of { message: { content: string }, done: boolean }
```
