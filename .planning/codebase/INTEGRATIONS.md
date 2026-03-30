# HealthBridge External Integrations

## External APIs & Services

### 1. Anthropic Claude API
**Purpose:** AI-powered health insurance guidance and document analysis
**Authentication:** `ANTHROPIC_API_KEY` environment variable
**SDK:** `@anthropic-ai/sdk` 0.80.0

**Integration Points (API Routes):**

- **`app/api/chat/route.ts`** — Conversational AI assistant for health insurance Q&A
  - Model: `claude-sonnet-4-6`
  - Max tokens: 1500
  - Features: streaming responses, system prompt with user context

- **`app/api/appeal/analyze/route.ts`** — Insurance denial analysis
  - Model: `claude-sonnet-4-6`
  - Max tokens: 1024
  - Output: JSON with `denialType`, `appealableIssues`, `recommendedApproach`, `successLikelihood`, `supportingDocuments`, `keyArguments`

- **`app/api/appeal/draft/route.ts`** — Formal appeal letter generation
  - Model: `claude-sonnet-4-6`
  - Max tokens: 2048
  - Features: streaming letter composition

- **`app/api/documents/parse/route.ts`** — Insurance document analysis (vision)
  - Model: `claude-sonnet-4-6`
  - Max tokens: 2000
  - Supports: PDF (base64) and image files (PNG, JPG, WebP)
  - Output: JSON with `documentType`, `summary`, `extractedFields`, `deadlines`, `planDetails`

- **`app/api/timeline/generate/route.ts`** — Enrollment deadline generation
  - Model: `claude-sonnet-4-6`
  - Max tokens: 1000
  - Output: JSON array of `TimelineEvent` objects with dates, types, urgency flags

- **`app/api/network-check/route.ts`** — AI fallback for provider network status
  - Model: `claude-sonnet-4-6`
  - Max tokens: 500
  - Fallback when CMS API unavailable
  - Output: JSON with `inNetwork` (boolean|null), `confidence`, `reasoning`, `suggestion`

---

### 2. Healthcare.gov / CMS Marketplace API
**Purpose:** Fetch real ACA marketplace plans by ZIP code and income
**Base URL:** `https://marketplace.api.healthcare.gov/api/v1/`
**Authentication:** `HEALTHCARE_GOV_API_KEY` environment variable
**Fallback Key:** `a94d697d-5fe2-43d5-b829-fbf1d52d9c49` (CMS public demo key, rate-limited)

**Integration Points:**

- **`lib/plans/plan-finder.ts`** — `fetchCountyFips(zipCode, apiKey)`
  - Endpoint: `GET /counties/by/zip/{zipCode}?apikey={apiKey}`
  - Returns: FIPS code for county lookup

- **`lib/plans/plan-finder.ts`** — `fetchACAPlans(profile)`
  - Endpoint: `POST /plans/search?apikey={apiKey}`
  - Request body: household income, people array (age, tobacco, pregnancy), market type, place (ZIP, state, county FIPS), year
  - Processing: extracts deductibles, OOP max, copays, benefits, applies APTC eligibility check
  - Returns up to 6 plans sorted by fit score

- **`app/api/network-check/route.ts`** — Provider network lookup (primary, before AI fallback)
  - Endpoint: `GET /plans/{planId}/providers?apikey={apiKey}&name={name}&zipcode={zip}&type={type}`
  - Type mapping: `'doctor'` → `'individual'`, `'hospital'` → `'facility'`

**Data Flow:**
1. User enters ZIP code + income
2. Fetch county FIPS for ZIP
3. POST search with household income and APTC eligibility
4. Parse response: extract deductible, OOP max, copays, benefits
5. Calculate fit scores against user profile
6. Return top 6 ranked plans

---

### 3. Hardcoded Employer Plan Database
**Location:** `lib/plans/plan-finder.ts` — `KNOWN_EMPLOYER_PLANS`
**Type:** Static in-code lookup (not an external API)

**Employers mapped:** Google, Amazon, Microsoft, Meta, Apple, hospital systems, universities

**Data per employer:**
- Plan names (e.g., "Anthem PPO", "Kaiser HMO", "Aetna HDHP")
- Plan notes and enrollment tips

---

## All API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `app/api/chat/route.ts` | POST | Conversational assistant |
| `app/api/eligibility/route.ts` | POST | Eligibility calculation |
| `app/api/plans/route.ts` | POST | Plan recommendations |
| `app/api/appeal/analyze/route.ts` | POST | Denial analysis |
| `app/api/appeal/draft/route.ts` | POST | Appeal letter (streaming) |
| `app/api/documents/parse/route.ts` | POST | Document parsing (vision) |
| `app/api/timeline/generate/route.ts` | POST | Deadline timeline |
| `app/api/network-check/route.ts` | POST | Provider network status |

**No inbound webhooks** — no external services call this app.

---

## Authentication & Key Management

| Key | Variable | Scope | Fallback |
|-----|----------|-------|---------|
| Anthropic Claude | `ANTHROPIC_API_KEY` | All AI routes | None — required |
| CMS Marketplace | `HEALTHCARE_GOV_API_KEY` | Plan search, network check | Public demo key (rate-limited) |

- No user authentication system (no OAuth, sessions, or database auth)
- No persistent database

---

## Data Handling & Privacy

**Sent to Claude:** user profile (immigration status, state, age, income), denial details, document contents (base64 vision)

**Sent to CMS API:** ZIP code, household income, age, provider name

**Not sent:** passwords, SSN, bank info, health records beyond voluntarily uploaded documents

**Client-side storage:** sessionStorage for chat history, profile state — nothing persisted to a server

---

## No Third-Party Analytics or Tracking
- No Google Analytics, Sentry, or error tracking
- No CDN configuration (Vercel default assumed)
- No payment processing, email, SMS, or external storage (S3, etc.)
