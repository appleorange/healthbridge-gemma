# HealthBridge Gemma — Project Status

**Last Updated:** 2026-05-07 (session 4)
**Current Phase:** Phase 4 — Hackathon Polish

---

## Milestone Checklist

### Phase 1 — Ollama Client
- [x] Confirm `gemma4:e4b` responding via curl
- [x] Create `lib/ai/client.ts` — Ollama wrapper
- [x] Remove `@anthropic-ai/sdk` from package.json
- [x] Verify zero TypeScript errors after removal

### Phase 2 — Route Migration
- [x] `/api/chat` — streaming
- [x] `/api/appeal/analyze` — JSON mode
- [x] `/api/appeal/draft` — streaming
- [x] `/api/appeal/extract` — multimodal (PDF → 422)
- [x] `/api/documents/parse` — multimodal (PDF → 422)
- [x] `/api/network-check` — JSON mode
- [x] `/api/timeline/generate` — JSON mode
- [x] `/api/checklist` — JSON mode
- [x] `/api/eligibility` — text mode (visaEligibilitySummary)

### Phase 3 — Offline-First Layer
- [x] Audit external HTTP calls
- [x] Build Healthcare.gov offline cache
- [x] Add network status detector to UI
- [x] Add NetworkStatusBadge to dashboard sidebar

### Phase 4 — Hackathon Polish
- [x] 25-case eligibility test matrix (10-profile smoke test; 2 bugs found and fixed)
- [x] Fix Gemma 4 prompt regressions (checklist simplification, timeline token reduction, parallel loading)
- [ ] Full offline demo run
- [ ] Writeup draft

---

## What's Done

- Eligibility engine bug fixes (2026-05-07): CHIP schema gap (`dependentsHaveUSCitizenChild` missing from Zod); Medicare APTC suppression (IRC § 36B). 10-profile matrix: 10/10 correct.
- `lib/ai/client.ts` — Ollama wrapper with `chat()`, `chatWithVision()`, `extractJSON<T>()`
- All 9 API routes migrated from Anthropic SDK to Ollama; `lib/api/anthropic.ts` deleted
- Zero TypeScript errors; app loads and serves 200
- All routes curl-tested: streaming routes stream, JSON routes return valid objects
- `lib/cache/plans.ts` — static ACA fallback data (Bronze/Silver/Gold, CA/NY/TX/FL/WA)
- `lib/plans/plan-finder.ts` — try/catch around CMS fetch; returns `{ plans, cached: true }` on failure
- `explore/page.tsx` — "Showing sample plans" banner shown when `cached: true`
- `components/ui/NetworkStatusBadge.tsx` — real-time online/offline indicator in sidebar
- `Sidebar.tsx` — NetworkStatusBadge wired into NavContent (desktop + mobile drawer)

## What's Next

Phase 4: Hackathon Polish (remaining)
1. Run 25-case eligibility test matrix; document Gemma 4 regressions
2. Full offline demo run (ethernet unplugged, complete onboarding→chat flow)
3. Writeup draft

## Known Limitations

- **PDF vision not supported**: Ollama has no document/PDF content type. `/api/documents/parse` and `/api/appeal/extract` both return HTTP 422 for PDFs with a clear user-facing message directing users to upload JPEG/PNG instead.
- **Model speed**: `gemma4:e4b` is fast enough for streaming and JSON routes within the 30s timeout. Non-streaming routes under complex prompts may occasionally be slow.
