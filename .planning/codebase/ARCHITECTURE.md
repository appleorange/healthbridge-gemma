# HealthBridge Architecture

## Overview
Next.js 14 AI-powered health insurance navigator. Guides US residents through insurance options based on immigration status, income, and personal circumstances. Zero server-side database — all user data stays in the browser.

## Architectural Pattern
- **Framework**: Next.js 14 with App Router (TypeScript)
- **UI**: React 18, Framer Motion, Lucide icons, Tailwind CSS
- **AI**: Anthropic Claude API (`claude-sonnet-4-6`) for guidance, document parsing, appeals
- **State**: React hooks + browser sessionStorage only
- **Persistence**: Client-side sessionStorage — clears on tab close (privacy-by-design)

---

## Main Layers

### 1. Presentation Layer (`app/` pages + `components/`)

**Pages:**
- `app/page.tsx` — Landing page
- `app/onboarding/page.tsx` — Multi-step questionnaire to collect `UserProfile`
- `app/dashboard/page.tsx` — Main post-onboarding interface (all tools)

**Feature Components:**
- `components/chat/ChatInterface.tsx` — Claude-powered Q&A
- `components/flowchart/EligibilityFlowchart.tsx` — Visual eligibility decision tree
- `components/timeline/EnrollmentTimeline.tsx` — Deadline timeline generator
- `components/plans/PlanCards.tsx` & `PlanComparison.tsx` — Plan display and comparison
- `components/calculators/CostEstimator.tsx` — Annual cost projections
- `components/documents/DocumentHub.tsx` — Document upload + parsing
- `components/network/NetworkChecker.tsx` — Provider network lookup
- `components/appeals/AppealAssistant.tsx` — Claim appeal workflow
- `components/help/GlossarySearch.tsx` — Insurance terminology
- `components/ui/` — Reusable primitives (Marquee, GradientText, Typewriter, SpotlightCard, etc.)

### 2. API Layer (`app/api/`)

All routes accept POST, return JSON or Server-Sent Events stream.

| Route | Purpose | External call |
|-------|---------|--------------|
| `app/api/chat/route.ts` | Streaming chat | Claude (streaming) |
| `app/api/eligibility/route.ts` | Plan eligibility | None (pure logic) |
| `app/api/plans/route.ts` | Plan lookup + ranking | Healthcare.gov API + Claude |
| `app/api/documents/parse/route.ts` | Vision document analysis | Claude (vision) |
| `app/api/timeline/generate/route.ts` | Dynamic deadlines | Claude |
| `app/api/appeal/analyze/route.ts` | Denial analysis | Claude |
| `app/api/appeal/draft/route.ts` | Appeal letter | Claude (streaming) |
| `app/api/network-check/route.ts` | Provider network | Healthcare.gov + Claude fallback |

### 3. Business Logic Layer (`lib/`)

Pure TypeScript — no I/O, no side effects:

- **`lib/eligibility/engine.ts`** — `calculateEligibility()`: plan qualification by immigration status, income, state rules; generates `FlowchartNode[]`/`FlowchartEdge[]` with legal basis
- **`lib/eligibility/onboarding-steps.ts`** — `ONBOARDING_STEPS[]` form definition with `showWhen` conditional field visibility
- **`lib/calculators/cost-estimator.ts`** — FPL calculation, Premium Tax Credit estimation, annual cost by plan type
- **`lib/plans/plan-finder.ts`** — Fit score algorithm (0–100), Healthcare.gov API client, county FIPS lookup, known employer plan database
- **`lib/prompts/system.ts`** — `buildSystemPrompt()`: context-aware Claude system prompt from user's immigration status and profile

### 4. Type System (`types/index.ts`)

Single source of truth for all data contracts:
- `UserProfile` — 40+ fields (immigration status, employment, income, health needs)
- `EligibilityResult` — eligible plans, recommendation, flowchart, cost estimates
- `PlanCard` / `PlanType` — plan display object with fit score
- `FlowchartNode` / `FlowchartEdge` — decision tree primitives
- `TimelineEvent` — deadline with date, type, urgency
- `ParsedDocument` — extracted insurance document data
- `ChatMessage` — chat history entry

---

## Key Data Flows

### Onboarding → Dashboard
```
/onboarding form (UserProfile)
  → POST /api/eligibility
  → calculateEligibility() [lib/eligibility/engine.ts]
  → EligibilityResult stored in sessionStorage
  → redirect /dashboard
```

### Chat
```
User message + userProfile
  → POST /api/chat
  → buildSystemPrompt() [lib/prompts/system.ts]
  → Claude stream → SSE response
  → persisted to sessionStorage (limit: 20 msgs/session)
```

### Document Upload
```
File (PDF/image) → base64
  → POST /api/documents/parse
  → Claude vision → ParsedDocument JSON
  → displayed in DocumentHub (limit: 3 docs/session)
```

### Plan Lookup
```
ZIP code + profile
  → POST /api/plans
  → fetchCountyFips() → Healthcare.gov plans search
  → calcFitScore() per plan → top 6 ranked PlanCards
```

---

## Key Design Decisions

1. **Immigration status as primary dimension** — all eligibility rules keyed to specific visa categories; separate logic for lawfully present vs. non-immigrant vs. undocumented

2. **Eligibility engine as pure function** — `calculateEligibility()` has no I/O; builds decision tree as side product; legal basis attached to every decision node

3. **Fit scoring for plan ranking** — deterministic 0–100 score balancing premium budget, deductible/OOP fit, benefit priorities, network type, star ratings

4. **Streaming for responsiveness** — SSE allows character-by-character response; avoids loading delays for chat and appeal drafting

5. **Zero server persistence** — sessionStorage only; clears on tab close; enables free hosting without a user database; multi-device access intentionally not supported

---

## State Management

```
sessionStorage keys:
  hb_profile          → UserProfile (set after onboarding)
  hb_eligibility      → EligibilityResult (set after eligibility calc)
  hb_chat_messages    → ChatMessage[] (chat history)
  hb_message_count    → number (limit: 20)
  hb_doc_count        → number (limit: 3)
  hb_appeal_count     → number (limit: 2)
```

Component state via React hooks only — no Redux, Context, or Zustand.
