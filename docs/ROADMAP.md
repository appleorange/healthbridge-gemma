# HealthBridge Gemma — Migration Roadmap

## Status Key
- `[ ]` not started
- `[~]` in progress
- `[x]` complete

---

## Phase 1 — Ollama Client

> Goal: replace the Anthropic SDK with a local Ollama client. Zero behavior change in routes — same inputs, same outputs, different inference backend.

- [ ] Confirm `gemma4:26b` is responding via `curl http://localhost:11434/api/tags` before writing any code
- [ ] Create `lib/ai/client.ts` — centralized Ollama wrapper with:
  - Non-streaming JSON mode (for analyze, parse, timeline, network-check routes)
  - Streaming mode (for chat, appeal/draft routes)
  - `AbortSignal.timeout(30000)` on every fetch call
  - Reads `OLLAMA_BASE_URL` and `OLLAMA_MODEL` from environment — no hardcoded values
  - Re-exports `extractJSON()` utility (same logic as current `lib/api/anthropic.ts`)
- [ ] Remove `@anthropic-ai/sdk` from `package.json` and run `npm install`
- [ ] Verify `npm run build` passes with zero TypeScript errors after removal

---

## Phase 2 — Route Migration

> Goal: swap every route that calls the Anthropic client to call `lib/ai/client.ts` instead. Routes must preserve all existing behavior: same Zod validation, same XML delimiters, same fallback logic, same response shape.

- [ ] Swap `/api/chat` — streaming chat with `userProfile` context injected via `buildSystemPrompt()`
  - Preserve: SSE streaming, 20-message session limit, XML user-input delimiters
- [ ] Swap `/api/appeal/analyze` — structured JSON output, Zod-validated
  - Preserve: JSON extraction fallback logic, safe fallback object on parse failure
- [ ] Swap `/api/appeal/draft` — streaming plain text letter
  - Preserve: SSE streaming, XML delimiters on all user-supplied denial fields
- [ ] Swap `/api/appeal/extract` — extract denial info from uploaded document (multimodal)
  - Note: verify Ollama vision support for `gemma4:26b` before implementing
- [ ] Swap `/api/documents/parse` — vision/multimodal, highest risk
  - Test carefully with a real denial letter PDF and an image
  - Preserve: base64 encoding, file type validation, 3-document session limit
- [ ] Swap `/api/network-check` — prompt swap; CMS Healthcare.gov primary path unchanged
  - Preserve: CMS API call first, AI fallback only when CMS returns no results
- [ ] Swap `/api/timeline/generate` — structured JSON output, Zod-validated
  - Preserve: JSON extraction, `TimelineEvent[]` shape validation
- [ ] Swap `/api/checklist` — structured JSON output
  - Preserve: action item shape, fallback to empty array on parse failure

---

## Phase 3 — Offline-First Layer

> Goal: the full user flow (onboarding → eligibility → plans → chat) must work with ethernet unplugged.

- [ ] Audit all external HTTP calls — list every route that calls Healthcare.gov or any other external API
- [ ] Build offline fallback cache for Healthcare.gov plan data
  - Cache as static JSON at `lib/plans/offline-cache.json`
  - Serve cache when Healthcare.gov API returns a network error or timeout
- [ ] Add network status detector to UI
  - Show a banner or badge when navigator.onLine is false
- [ ] Add persistent "Running locally — no data transmitted" badge to dashboard
  - Component: `components/ui/TrustBanner.tsx` (file already exists — integrate if not already showing)

---

## Phase 4 — Hackathon Polish

> Goal: demo-ready, no regressions, compelling narrative.

- [ ] Run full 25-case eligibility test matrix, document any Gemma 4 regressions
  - Matrix lives in `.claude/TASKS.md` (original project)
  - Log any accuracy gaps with specific status + income + state combinations
- [ ] Fix prompt regressions — Gemma 4 is more literal than Claude Sonnet; system prompts may need to be more explicit about:
  - Output format (JSON only, no markdown, no explanation)
  - Response length constraints
  - Staying in character as HealthBridge AI
- [ ] Full offline demo run: unplug ethernet, complete onboarding → eligibility → plan recommendations → chat → appeal flow, confirm everything works end to end
- [ ] Writeup draft — include:
  - Architecture section (Next.js + Ollama + local inference)
  - Gemma 4 specific decisions (why 26B, how prompts were tuned)
  - Privacy narrative (zero external AI calls, sessionStorage only, no database)

---

## Session Log

| Date | Summary |
|------|---------|
| 2026-05-05 | Scaffold created — documentation and config files initialized for Gemma 4 migration |
