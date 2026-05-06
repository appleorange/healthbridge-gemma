# HealthBridge Gemma — Project Status

**Last Updated:** 2026-05-06
**Current Phase:** Phase 3 — Offline-First Layer

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
- [ ] Audit external HTTP calls
- [ ] Build Healthcare.gov offline cache
- [ ] Add network status detector to UI
- [ ] Add TrustBanner to dashboard

### Phase 4 — Hackathon Polish
- [ ] 25-case eligibility test matrix
- [ ] Fix Gemma 4 prompt regressions
- [ ] Full offline demo run
- [ ] Writeup draft

---

## What's Done

- `lib/ai/client.ts` — Ollama wrapper with `chat()`, `chatWithVision()`, `extractJSON<T>()`
- All 9 API routes migrated from Anthropic SDK to Ollama; `lib/api/anthropic.ts` deleted
- Zero TypeScript errors; app loads and serves 200
- All routes curl-tested: streaming routes stream, JSON routes return valid objects

## What's Next

Phase 3: Offline-First Layer
1. Audit which routes call external APIs (Healthcare.gov, CMS)
2. Build `lib/plans/offline-cache.json` for Healthcare.gov plan data
3. Add `navigator.onLine` network status detector to UI
4. Wire `TrustBanner.tsx` into dashboard layout

## Known Limitations

- **PDF vision not supported**: Ollama has no document/PDF content type. `/api/documents/parse` and `/api/appeal/extract` both return HTTP 422 for PDFs with a clear user-facing message directing users to upload JPEG/PNG instead.
- **Model speed**: `gemma4:e4b` is fast enough for streaming and JSON routes within the 30s timeout. Non-streaming routes under complex prompts may occasionally be slow.
