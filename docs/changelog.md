# HealthBridge Gemma — Changelog

---

## [2026-05-07] Phase 4 — EligibilityThinkingBanner + sessionStorage step persistence

- Created `components/ui/EligibilityThinkingBanner.tsx` — reads `hb_thinking_steps` from sessionStorage; shows which of the 5 reasoning steps Gemma 4 verified (green checkmark + regulatory citation), leaving un-fired steps gray (correct for H-1B: step 3 / 5-year bar stays gray)
- Dashboard `page.tsx` imports and renders the banner between TrustBanner and the checklist
- Onboarding `page.tsx` saves `hb_thinking_steps` JSON to sessionStorage at result-event time using a local accumulator (avoids stale React closure)
- E2E verified: H-1B @ Google, CA, $180k, HH=2 — steps 1, 2, 4, 5 green; step 3 gray; correct employer-sponsored recommendation; sub-15s end-to-end; zero console errors

## [2026-05-07] Phase 4 — Thinking SSE route + onboarding step-progress UI

- Created `app/api/eligibility/thinking/route.ts` — POST SSE endpoint that streams `{type:"step",step:N}` events as Gemma 4 thinks through eligibility categories, then a final `{type:"result",eligibility:{...}}` event; calls `chatWithThinking()` from `lib/ai/client.ts` with `think:true`
- Updated `app/onboarding/page.tsx` — last-step submission now calls `/api/eligibility/thinking` and reads the SSE stream; replaced "Analyzing your profile..." loading spinner with an animated 5-step progress panel; steps mark green as their keyword fires in the thinking stream (order-independent); steps that never fire remain gray (correct for visa types like H-1B where the 5-year bar step doesn't apply)
- Updated `lib/ai/client.ts` default `THINKING_TIMEOUT_MS` from 60s to 180s; added `OLLAMA_THINKING_TIMEOUT_MS=180000` to `.env`
- Build passes zero TypeScript errors; `/api/eligibility` route unchanged

---

## [2026-05-07] Phase 4 — Eligibility engine bug fixes (CHIP schema gap + Medicare APTC flag)

**Fix 1 — CHIP schema gap (mixed-status families)**
- `lib/validation/schemas.ts`: added `dependentsHaveUSCitizenChild: z.boolean().optional()` to `UserProfileSchema`
- Root cause: field existed in `types/index.ts` and the onboarding form but was absent from the Zod schema; Zod stripped it before the engine saw it, so the CHIP eligibility branch never evaluated
- Impact: undocumented / DACA / TPS parents with US-citizen or LPR children were returned `short_term` as primary recommendation instead of CHIP — a materially incorrect result for mixed-status families
- Verified: Profile 4 (undocumented, TX, $18k, HH3, 2 USC children) now returns `chip` as primary with correct CHIP eligibility flags

**Fix 2 — Medicare APTC flag suppression**
- `lib/eligibility/engine.ts`: when `adjustedPrimary === 'medicare'`, APTC circumstance flag is removed from `specialCircumstances` and `subsidyEligible` is returned as `false`
- Root cause: the APTC calculation was correct for ACA marketplace standalone but didn't account for the IRC § 36B prohibition on Premium Tax Credits for months enrolled in Medicare
- Added TODO comment: model Medicare Savings Programs (QMB/SLMB/QI) as a future low-income supplement path for Medicare-primary users
- Verified: Profile 9 (US citizen, 67yo, FL, $24k) now returns `subsidyEligible: false` with no APTC flag; Medicare remains primary recommendation

**Full 10-profile matrix re-run: 10/10 correct after both fixes**

---

## [2026-05-06] Phase 4 — Checklist optimizations and parallel dashboard loading

**Opt 1 — Checklist type and prompt simplification:**
- `types/index.ts`: removed `id`, `link`, `linkLabel` from `ChecklistItem` (model reliably omits them; they added noise)
- `app/api/checklist/route.ts`: prompt reduced to 4 required fields (category, title, detail, urgent), max 5 items; filter/map block updated to match
- `components/checklist/ActionChecklist.tsx`: switched expand-state key from `item.id` to `item.title`; removed link/ExternalLink block and unused import

**Opt 2 — Timeline profile serialization:**
- `app/api/timeline/generate/route.ts`: extracts only the 22 profile fields relevant to enrollment-deadline generation (drops healthcare usage, prescriptions, benefit priorities, subsidy/ACA fields, etc.) — reduces ~1,200 tokens → ~300 tokens in the profile block
- Removed `null, 2` pretty-printing from both profile and eligibility JSON; compact serialization saves ~200 additional tokens

**Opt 3 — Parallel dashboard loading:**
- `app/dashboard/page.tsx`: checklist and timeline fetches now fire simultaneously on dashboard load (not checklist-first, then timeline lazily on accordion expand)
- SessionStorage cache added for timeline (`hb_timeline`) — subsequent dashboard visits skip both fetches
- `components/timeline/EnrollmentTimeline.tsx`: accepts `preloadedAiEvents` and `preloadedLoading` props; skips self-fetch when parent is managing the call; retains self-fetch as standalone fallback

**console.time instrumentation stripped** from all 9 API routes before ship.

**Measured timings (Gemma 4 on CPU, ~0.18 tok/s):**
- Eligibility / recommendation page: **~6.7s total** — ✅ under 8s target
- Checklist (Ollama inference): **11.7s**
- Timeline (Ollama inference): **22.7s**
- Dashboard fully loaded (parallel): **~22.7s** — bottlenecked by timeline inference on this CPU
- Dashboard with both caches warm: **<1s** (sessionStorage hydration only)

---

## [2026-05-06] Bug fixes — chat abort, false offline banner, slowness

**Issue 1 — Chat stream abort:**
- `lib/ai/client.ts`: streaming calls now use `OLLAMA_STREAM_TIMEOUT_MS` (default 300s) instead of the 30s non-streaming timeout; non-streaming uses `OLLAMA_TIMEOUT_MS` (now 120s)
- `components/chat/ChatInterface.tsx`: frontend fetch timeout raised from 30s to 300s (matches server stream timeout)
- `ChatInterface.tsx`: replaced hardcoded Anthropic "Check API key" error message with a generic retry message

**Issue 2 — False "Showing sample plans" when online:**
- `lib/plans/plan-finder.ts`: `fetchACAPlans` now propagates network errors (TypeError from fetch) instead of swallowing all errors
- `getPlansForProfile` only serves the static cache (cached:true) on genuine network failures; API errors (401, 400, etc.) and 0-result responses now return mocked estimated plans with `cached:false`
- Added `AbortSignal.timeout(10000)` to Healthcare.gov fetch to prevent indefinite hangs

**Issue 3 — General slowness:**
- `.env`: `OLLAMA_TIMEOUT_MS` raised from 30000 → 120000 (non-streaming routes no longer timeout mid-generation)
- `lib/prompts/system.ts`: `BASE_HEALTHCARE_PROMPT` trimmed from ~485 words to ~110 words; STATUS_PROMPTS carry all visa-specific knowledge

---

## [2026-05-06] Phase 3 — Offline-First Layer complete

**Part A — Healthcare.gov offline fallback:**
- `lib/cache/plans.ts`: static Bronze/Silver/Gold ACA plan data for CA/NY/TX/FL/WA + generic fallback
- `lib/plans/plan-finder.ts`: wraps CMS fetch in try/catch; returns `{ plans, cached: true }` on network failure
- `/api/plans`: passes `cached` flag through to client
- `app/dashboard/explore/page.tsx`: shows "Showing sample plans — connect to internet for real-time data" banner when `cached: true`

**Part B — Offline indicator UI:**
- `components/ui/NetworkStatusBadge.tsx`: new client component — listens to `navigator.onLine` + `online`/`offline` window events; shows muted-green "Local AI — your data stays on this device" badge always; adds amber "● Offline mode" row when offline
- `components/dashboard/Sidebar.tsx`: `NetworkStatusBadge` added at bottom of `NavContent` — visible on every dashboard page (desktop sidebar + mobile drawer)
- Zero TypeScript errors

---

## [2026-05-06] Phase 2 — All API routes migrated to Ollama

Migrated all 9 routes from `@anthropic-ai/sdk` to `lib/ai/client.ts`. Zero TypeScript errors. App loads and serves 200.

**Routes migrated:**
- `/api/chat` — streaming: NDJSON→plain text pipe; Ollama stream decoded via `ReadableStream` reader
- `/api/appeal/analyze` — JSON mode: `extractJSON<T>(text, fallback)` replaces try/catch pattern
- `/api/appeal/draft` — streaming: same NDJSON→text pattern as `/api/chat`
- `/api/documents/parse` — vision: `chatWithVision()` with base64 images array; PDF returns 422 (Ollama limitation)
- `/api/appeal/extract` — vision: same pattern as documents/parse; PDF returns 422
- `/api/network-check` — JSON mode: CMS primary path untouched; AI fallback swapped
- `/api/timeline/generate` — JSON mode: direct swap, `extractJSON` with typed `[]` fallback
- `/api/checklist` — JSON mode: custom JSON parsing replaced with `extractJSON`
- `/api/eligibility` — text mode: `generateVisaSummary()` swapped to `chat(..., false)`

**Breaking change:** `lib/api/anthropic.ts` deleted; `@anthropic-ai/sdk` was already absent from `package.json`.
**Known limitation:** PDF parsing not supported by Ollama's vision API — both vision routes return 422 for PDFs with a clear user-facing message.

---

## [2026-05-06] Phase 1 — lib/ai/client.ts created

- Created `lib/ai/client.ts`: centralized Ollama wrapper replacing `lib/api/anthropic.ts`
- Exports `chat()` (overloaded: `stream: false` → `Promise<string>`, `stream: true` → `Promise<ReadableStream>`)
- Exports `chatWithVision()` for base64 image arrays in Ollama's vision format
- Exports `extractJSON<T>(text, fallback)` — strips markdown fences, embedded JSON extraction, typed fallback
- All calls include `AbortSignal.timeout(TIMEOUT_MS)` (default 30s, configurable via `OLLAMA_TIMEOUT_MS`)
- All calls pass `think: false` to suppress Gemma 4's extended-thinking mode
- Confirmed real response from `gemma4:26b` via streaming test ("Hello from Gemma")
- **Hardware note:** `gemma4:26b` generates ~0.18 tok/s on this machine (CPU inference). Non-streaming calls require `OLLAMA_TIMEOUT_MS=120000` or higher. Streaming calls work within 30s (first token arrives in ~8s).

---

## [2026-05-05] Project initialized — Gemma 4 migration scaffold created

Built on top of existing HealthBridge codebase (commit `5fce665`). The original codebase has a fully working Next.js 14 app with Anthropic Claude API integration. This scaffold prepares it for migration to local Ollama inference with `gemma4:26b`.

**Files created:**
- `CLAUDE.md` — session start checklist, workflow rules, self-improvement loop, project-specific Ollama rules
- `.env` / `.env.example` — `OLLAMA_BASE_URL` and `OLLAMA_MODEL` environment variables
- `requirements.txt` — hackathon judge reference: Ollama >= 0.6, gemma4:26b, Node >= 18
- `docs/ROADMAP.md` — four-phase migration plan (Ollama client → route migration → offline-first → polish)
- `docs/project_spec.md` — product requirements and engineering rules
- `docs/architecture.md` — system overview, data flows, component responsibilities for all 50+ files
- `docs/changelog.md` — this file
- `docs/project_status.md` — current status snapshot
- `docs/lessons.md` — lessons log initialized
- `.claude/commands/` — empty directory for future custom commands

**No source files were modified.** The existing app, components, lib, types, and API routes are unchanged.
