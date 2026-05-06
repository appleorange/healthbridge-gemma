# HealthBridge Gemma — Changelog

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
