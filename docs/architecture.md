# HealthBridge Gemma — Architecture

## System Overview

HealthBridge is a Next.js 14 app that runs entirely on the user's local machine. All AI inference is handled by a local Ollama instance running `gemma4:26b` — no data is sent to any external AI API. Healthcare.gov CMS API is used for real plan data with a local JSON cache as offline fallback. The eligibility engine is pure TypeScript with no AI dependency.

All AI-powered features (chat, document parsing, appeal drafting, network checking, timeline generation, checklist generation) route through a single centralized client in `lib/ai/client.ts`. Route files never call Ollama directly.

---

## Data Flow

```
User input (browser)
  → Zod schema validation (lib/validation/schemas.ts)
  → Next.js API route (app/api/*/route.ts)
  → lib/ai/client.ts
  → POST http://localhost:11434/api/chat (Ollama, gemma4:26b)
  → structured JSON or streamed text response
  → UI component
```

**Eligibility path (no AI):**
```
Onboarding form (UserProfile)
  → POST /api/eligibility
  → calculateEligibility() [lib/eligibility/engine.ts]
  → EligibilityResult stored in sessionStorage (hb_eligibility)
  → redirect /dashboard
```

**Plan lookup path:**
```
ZIP code + UserProfile
  → POST /api/plans
  → fetchCountyFips() → Healthcare.gov CMS API (or offline cache fallback)
  → calcFitScore() per plan
  → top 6 PlanCards ranked by fit score
```

---

## Component Responsibilities

### Pages

| File | Responsibility |
|------|---------------|
| `app/page.tsx` | Landing page — assembles all landing sections with Lenis smooth scroll |
| `app/layout.tsx` | Root layout — global metadata, fonts, and client providers wrapper |
| `app/providers.tsx` | Client-side providers — Lenis scroll instance, global animation setup |
| `app/onboarding/page.tsx` | Multi-step questionnaire — collects UserProfile with conditional field visibility |
| `app/dashboard/layout.tsx` | Dashboard shell — Sidebar navigation, page content slot |
| `app/dashboard/page.tsx` | Dashboard home — eligibility summary, plan recommendation, next deadline |
| `app/dashboard/explore/page.tsx` | Plan exploration — PlanCards grid, PlanComparison tool |
| `app/dashboard/tools/page.tsx` | Insurance tools — CostEstimator, DocumentHub, NetworkChecker, AppealAssistant |
| `app/dashboard/help/page.tsx` | Help center — GlossarySearch, EnrollmentTimeline |

### API Routes

| File | Responsibility |
|------|---------------|
| `app/api/chat/route.ts` | Streaming chat — injects userProfile via buildSystemPrompt(), enforces 20-message limit |
| `app/api/eligibility/route.ts` | Eligibility calculation — calls calculateEligibility(), no AI dependency |
| `app/api/plans/route.ts` | Plan lookup — Healthcare.gov CMS API + fit scoring, returns top 6 PlanCards |
| `app/api/documents/parse/route.ts` | Vision document analysis — base64 image/PDF → ParsedDocument JSON |
| `app/api/timeline/generate/route.ts` | Enrollment timeline — returns TimelineEvent[] based on status and life events |
| `app/api/appeal/analyze/route.ts` | Denial analysis — structured JSON with denial reason, policy basis, appeal strategy |
| `app/api/appeal/draft/route.ts` | Appeal letter — streaming plain-text letter with XML-delimited user inputs |
| `app/api/appeal/extract/route.ts` | Document extraction — pulls denial details from uploaded letter (multimodal) |
| `app/api/network-check/route.ts` | Network lookup — CMS API primary, AI fallback for provider confirmation |
| `app/api/checklist/route.ts` | Action checklist — generates next-step items after eligibility result |

### Feature Components

| File | Responsibility |
|------|---------------|
| `components/chat/ChatInterface.tsx` | Streaming chat UI with sessionStorage message persistence and 20-message gate |
| `components/flowchart/EligibilityFlowchart.tsx` | Visual decision tree rendering FlowchartNode[] and FlowchartEdge[] |
| `components/timeline/EnrollmentTimeline.tsx` | Deadline calendar rendering TimelineEvent[] with urgency color coding |
| `components/plans/PlanCards.tsx` | Plan grid with SVG fit score rings and compare toggle |
| `components/plans/PlanComparison.tsx` | Side-by-side comparison of up to 3 selected plans |
| `components/calculators/CostEstimator.tsx` | Annual cost breakdowns using FPL and Premium Tax Credit estimates |
| `components/documents/DocumentHub.tsx` | File upload (PDF/image), parse request, and ParsedDocument results display |
| `components/network/NetworkChecker.tsx` | Provider name + ZIP input → network status result |
| `components/appeals/AppealAssistant.tsx` | Multi-step appeal workflow: entry → analyze → draft → track |
| `components/help/GlossarySearch.tsx` | Insurance terminology search with plain-language definitions |
| `components/checklist/ActionChecklist.tsx` | Post-eligibility next-steps list with completion tracking |
| `components/dashboard/Sidebar.tsx` | Dashboard navigation sidebar with route-aware active state |
| `components/onboarding/AnimatedField.tsx` | Animated wrapper for individual onboarding form fields |

### Landing Page Components

| File | Responsibility |
|------|---------------|
| `components/landing/NavBar.tsx` | Landing page navigation bar with scroll-aware behavior |
| `components/landing/HeroSection.tsx` | Hero with animated product demo and stats |
| `components/landing/FeaturesSection.tsx` | Feature grid with scroll-triggered reveals |
| `components/landing/HowItWorksSection.tsx` | Three-step process explanation |
| `components/landing/BeforeAfterSection.tsx` | Before/after comparison of navigating insurance without/with HealthBridge |
| `components/landing/FAQSection.tsx` | Accordion FAQ for common immigration insurance questions |
| `components/landing/CTASection.tsx` | Call-to-action leading to onboarding |
| `components/landing/MarqueeSection.tsx` | Scrolling insurance-related terms or partner logos |

### UI Primitives

| File | Responsibility |
|------|---------------|
| `components/ui/Marquee.tsx` | Infinite scrolling horizontal list primitive |
| `components/ui/GradientText.tsx` | Brand-colored gradient text span |
| `components/ui/SpotlightCard.tsx` | Card with cursor-following spotlight highlight on hover |
| `components/ui/StepTransition.tsx` | Animated slide transition between onboarding steps |
| `components/ui/Typewriter.tsx` | Character-by-character text animation (used in chat) |
| `components/ui/AnimatedList.tsx` | Staggered entrance animation for list items |
| `components/ui/AnimatedProgressBar.tsx` | Animated progress bar (onboarding progress) |
| `components/ui/CountUp.tsx` | Animated number counter (landing page stats) |
| `components/ui/LanguageToggle.tsx` | English/Spanish language switcher |
| `components/ui/TrustBanner.tsx` | "Running locally — no data transmitted" persistent badge |

### Business Logic (`lib/`)

| File | Responsibility |
|------|---------------|
| `lib/ai/client.ts` | **[Phase 1 target]** Centralized Ollama wrapper — streaming and JSON modes, AbortSignal.timeout |
| `lib/api/anthropic.ts` | Current Anthropic SDK client + extractJSON utility — **to be replaced by lib/ai/client.ts** |
| `lib/eligibility/engine.ts` | `calculateEligibility()` — pure function, 14+ status categories, FlowchartNode[] output with legal citations |
| `lib/eligibility/onboarding-steps.ts` | `ONBOARDING_STEPS[]` form definition with `showWhen` conditional visibility rules |
| `lib/eligibility/rules.ts` | Policy constants — state lists, eligible status sets, Medicaid expansion data |
| `lib/calculators/cost-estimator.ts` | FPL percentage calculation, Premium Tax Credit estimation, annual cost by plan type |
| `lib/plans/plan-finder.ts` | Fit score algorithm (0–100), Healthcare.gov CMS API client, county FIPS lookup |
| `lib/prompts/system.ts` | `buildSystemPrompt()` and 14 immigration status-specific context blocks |
| `lib/validation/schemas.ts` | Zod schemas for all API route inputs |
| `lib/constants/fpl.ts` | Federal Poverty Level thresholds — single source of truth for both engine and calculator |
| `lib/dashboard/plan-info.ts` | Helper that derives plan summary text for the dashboard overview |
| `lib/i18n/es.ts` | Spanish translations for UI strings |

### Hooks

| File | Responsibility |
|------|---------------|
| `hooks/useLanguage.ts` | Language/locale state with sessionStorage persistence |
| `hooks/useScrollReveal.ts` | Intersection Observer wrapper for scroll-triggered entrance animations |

### Types

| File | Responsibility |
|------|---------------|
| `types/index.ts` | Single source of truth for all shared TypeScript types: UserProfile, EligibilityResult, PlanCard, PlanType, FlowchartNode, FlowchartEdge, TimelineEvent, ParsedDocument, ChatMessage, ImmigrationStatus, EmploymentStatus |

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Local Ollama inference | Zero data transmitted to external AI APIs — privacy by design, works offline |
| `lib/ai/client.ts` as single AI gateway | One place to configure timeouts, model, error handling — routes never know the inference backend |
| Eligibility engine as pure function | No AI in eligibility decisions — deterministic, auditable, citation-backed |
| sessionStorage only | Privacy by design; free hosting without infrastructure; clears on tab close |
| Healthcare.gov CMS API with offline cache | Real plan data for accuracy; cache ensures offline demo works |
| Zod validation at all route boundaries | Runtime safety — TypeScript types don't protect against malformed API inputs |
| XML delimiter tags on user inputs | Prompt injection mitigation — user text cannot escape its semantic container |

---

## Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `OLLAMA_BASE_URL` | Server-side only | Ollama API base URL (default: `http://localhost:11434`) |
| `OLLAMA_MODEL` | Server-side only | Ollama model identifier (default: `gemma4:26b`) |
| `HEALTHCARE_GOV_API_KEY` | Server-side only | CMS Healthcare.gov Marketplace API key |
| `NEXT_PUBLIC_APP_URL` | Client + server | Public app base URL |
