# HealthBridge Gemma — Project Status

**Last Updated:** 2026-05-05
**Current Phase:** Phase 1 — Ollama Client

---

## Milestone Checklist

### Phase 1 — Ollama Client
- [ ] Confirm `gemma4:26b` responding via curl
- [ ] Create `lib/ai/client.ts` — Ollama wrapper
- [ ] Remove `@anthropic-ai/sdk` from package.json
- [ ] Verify zero TypeScript errors after removal

### Phase 2 — Route Migration
- [ ] `/api/chat` — streaming
- [ ] `/api/appeal/analyze` — JSON mode
- [ ] `/api/appeal/draft` — streaming
- [ ] `/api/appeal/extract` — multimodal
- [ ] `/api/documents/parse` — multimodal
- [ ] `/api/network-check` — JSON mode
- [ ] `/api/timeline/generate` — JSON mode
- [ ] `/api/checklist` — JSON mode

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

- Foundation files created: `CLAUDE.md`, `.env`, `.env.example`, `requirements.txt`, all `docs/` files, `.claude/commands/`
- Existing codebase fully intact — no source files modified

## What's Next

1. Confirm Ollama is running: `curl http://localhost:11434/api/tags`
2. Confirm the model is available: `ollama list` (should show `gemma4:26b`)
3. If confirmed, begin Phase 1, Task 2: create `lib/ai/client.ts`

## Blockers

None known. Ollama status not yet confirmed.

---

## Notes

- The existing `lib/api/anthropic.ts` has `extractJSON()` — this must be preserved in `lib/ai/client.ts` during Phase 1
- All 8 routes use `lib/api/anthropic.ts` either directly or via re-exported utilities
- Vision/multimodal support in `gemma4:26b` via Ollama should be verified before Phase 2 document/appeal/extract routes
