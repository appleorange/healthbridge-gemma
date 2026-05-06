# HealthBridge Gemma — Project Status

**Last Updated:** 2026-05-06
**Current Phase:** Phase 1 — Ollama Client (in progress)

---

## Milestone Checklist

### Phase 1 — Ollama Client
- [x] Confirm `gemma4:26b` responding via curl
- [x] Create `lib/ai/client.ts` — Ollama wrapper
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
- `lib/ai/client.ts` created and verified — Ollama wrapper with `chat()`, `chatWithVision()`, `extractJSON<T>()`.
  - Real response confirmed: Gemma 4 returned "Hello from Gemma" in streaming test
  - `think: false` required to suppress extended-thinking mode on this model

## What's Next

Phase 1, Task 3: Remove `@anthropic-ai/sdk` from `package.json`, run `npm install`, and verify `npm run build` passes with zero TypeScript errors.

## Blockers / Hardware Notes

- `gemma4:26b` generates ~0.18 tok/s on this machine (CPU inference, Q4_K_M, 18GB model)
- Non-streaming calls need `OLLAMA_TIMEOUT_MS=120000` in `.env` — 30s is too short for full responses
- Streaming calls work fine within 30s (first token ~8s after request)
- **Action required before Phase 2:** add `OLLAMA_TIMEOUT_MS=120000` to `.env`

---

## Notes

- The existing `lib/api/anthropic.ts` still present — will be deleted in Phase 2 after all routes migrate
- `extractJSON<T>()` in `lib/ai/client.ts` now takes a typed fallback (improved over original which threw on failure)
- Vision/multimodal support via Ollama verified at API level; functional test deferred to Phase 2 document routes
