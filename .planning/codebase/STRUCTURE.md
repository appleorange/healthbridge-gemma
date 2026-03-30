# HealthBridge Directory Structure

## Directory Tree

```
healthbridge-final/
├── app/                                    # Next.js App Router
│   ├── page.tsx                            # Landing page (/)
│   ├── layout.tsx                          # Root layout + metadata
│   ├── globals.css                         # Tailwind + brand color variables
│   ├── onboarding/
│   │   └── page.tsx                        # Multi-step questionnaire (/onboarding)
│   ├── dashboard/
│   │   └── page.tsx                        # Main app interface (/dashboard)
│   └── api/                                # Server-side API routes (all POST)
│       ├── chat/route.ts                   # Claude streaming chat
│       ├── eligibility/route.ts            # Eligibility calculation
│       ├── plans/route.ts                  # Plan lookup + ranking
│       ├── documents/parse/route.ts        # Document analysis (vision)
│       ├── timeline/generate/route.ts      # Deadline generation
│       ├── appeal/analyze/route.ts         # Denial analysis
│       ├── appeal/draft/route.ts           # Appeal letter (streaming)
│       └── network-check/route.ts          # Provider network lookup
│
├── components/
│   ├── ui/                                 # Reusable primitives
│   │   ├── Marquee.tsx                     # Scrolling list (landing page)
│   │   ├── GradientText.tsx                # Gradient text spans
│   │   ├── SpotlightCard.tsx               # Spotlight hover card
│   │   ├── StepTransition.tsx              # Form step animations
│   │   ├── Typewriter.tsx                  # Character animation (chat)
│   │   ├── AnimatedList.tsx                # Staggered list animations
│   │   ├── AnimatedProgressBar.tsx         # Progress bar
│   │   └── CountUp.tsx                     # Animated number counter
│   ├── chat/
│   │   └── ChatInterface.tsx               # Full chat UI + sessionStorage persistence
│   ├── flowchart/
│   │   └── EligibilityFlowchart.tsx        # Visual eligibility decision tree
│   ├── plans/
│   │   ├── PlanCards.tsx                   # Plan grid with fit score rings
│   │   └── PlanComparison.tsx              # Side-by-side plan comparison
│   ├── timeline/
│   │   └── EnrollmentTimeline.tsx          # Deadline calendar + action items
│   ├── calculators/
│   │   └── CostEstimator.tsx               # Annual cost breakdowns
│   ├── documents/
│   │   └── DocumentHub.tsx                 # Upload + parse + results display
│   ├── network/
│   │   └── NetworkChecker.tsx              # Doctor/provider network lookup
│   ├── appeals/
│   │   └── AppealAssistant.tsx             # Claim appeal workflow (entry→analysis→draft→track)
│   └── help/
│       └── GlossarySearch.tsx              # Insurance terminology reference
│
├── lib/                                    # Pure business logic (no side effects)
│   ├── eligibility/
│   │   ├── engine.ts                       # calculateEligibility() — core logic
│   │   │                                   #   FPL %, plan qualification, flowchart generation
│   │   └── onboarding-steps.ts             # ONBOARDING_STEPS[], US_STATES[], showWhen rules
│   ├── calculators/
│   │   └── cost-estimator.ts               # FPL, Premium Tax Credit, annual cost by plan type
│   ├── plans/
│   │   └── plan-finder.ts                  # Fit score algo, Healthcare.gov API, FIPS lookup,
│   │                                       # KNOWN_EMPLOYER_PLANS database
│   └── prompts/
│       └── system.ts                       # buildSystemPrompt() — context-aware Claude prompts
│
├── types/
│   └── index.ts                            # ALL shared TypeScript types (single source of truth)
│                                           #   UserProfile, EligibilityResult, PlanCard, PlanType,
│                                           #   FlowchartNode/Edge, TimelineEvent, ParsedDocument,
│                                           #   ChatMessage, ImmigrationStatus, EmploymentStatus...
│
├── .planning/
│   └── codebase/                           # Codebase documentation
│
├── package.json                            # Dependencies + scripts
├── tsconfig.json                           # Strict TS, ES2017, @/* alias
├── tailwind.config.js                      # Content paths
├── postcss.config.js                       # @tailwindcss/postcss plugin
├── next.config.js                          # serverComponentsExternalPackages: [@anthropic-ai/sdk]
├── .env.local.example                      # Env var template
└── .env.local                              # ANTHROPIC_API_KEY, HEALTHCARE_GOV_API_KEY (gitignored)
```

---

## Route → File Mapping

| URL | File |
|-----|------|
| `GET /` | `app/page.tsx` |
| `GET /onboarding` | `app/onboarding/page.tsx` |
| `GET /dashboard` | `app/dashboard/page.tsx` |
| `POST /api/eligibility` | `app/api/eligibility/route.ts` |
| `POST /api/chat` | `app/api/chat/route.ts` |
| `POST /api/plans` | `app/api/plans/route.ts` |
| `POST /api/documents/parse` | `app/api/documents/parse/route.ts` |
| `POST /api/timeline/generate` | `app/api/timeline/generate/route.ts` |
| `POST /api/appeal/analyze` | `app/api/appeal/analyze/route.ts` |
| `POST /api/appeal/draft` | `app/api/appeal/draft/route.ts` |
| `POST /api/network-check` | `app/api/network-check/route.ts` |

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `ChatInterface.tsx` |
| Directories | kebab-case | `components/chat/` |
| API routes | lowercase | `route.ts` |
| Types | PascalCase | `UserProfile`, `EligibilityResult` |
| Functions | camelCase | `calculateEligibility`, `getFPLPercentage` |
| Constants | UPPER_SNAKE_CASE | `ONBOARDING_STEPS`, `MESSAGE_LIMIT` |
| sessionStorage keys | `hb_` prefix | `hb_profile`, `hb_chat_messages` |

---

## Module Resolution

`tsconfig.json` path alias:
```json
{ "paths": { "@/*": ["./*"] } }
```

Usage:
```typescript
import { calculateEligibility } from '@/lib/eligibility/engine'
import type { UserProfile } from '@/types'
import ChatInterface from '@/components/chat/ChatInterface'
```

---

## Key Files Quick Reference

| What you need | Where to look |
|---------------|--------------|
| All TypeScript types | `types/index.ts` |
| Eligibility rules | `lib/eligibility/engine.ts` |
| Onboarding form fields | `lib/eligibility/onboarding-steps.ts` |
| Plan fit scoring | `lib/plans/plan-finder.ts` |
| Claude system prompt | `lib/prompts/system.ts` |
| Cost calculations | `lib/calculators/cost-estimator.ts` |
| Brand colors | `app/globals.css` (CSS variables) |
| Reusable CSS classes | `app/globals.css` (@layer components) |
| Environment variables | `.env.local.example` |
