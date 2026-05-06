# HealthBridge Gemma — Claude Working Instructions

## Session Start Checklist (run EVERY session before touching any code)

1. Read `docs/ROADMAP.md` — confirm current phase and task statuses
2. Read `docs/project_status.md` — confirm what was last completed
3. Read `docs/lessons.md` — apply any lessons before writing code
4. Run `git branch` — confirm you are NOT on main; create a feature branch if needed
5. State out loud: "Current phase: X. Last completed: Y. Starting on: Z."

Do not skip this checklist. Do not write code before completing it.

---

## Workflow Rules

**One module at a time.** Finish and verify one task before moving to the next. Do not open multiple tasks simultaneously.

**Plan before code.** For any non-trivial change, enter plan mode first. State what files will change, what the interface contract is, and what could go wrong. Get agreement before writing code.

**Subagents for isolated work.** Use subagents for research, codebase exploration, and parallel analysis. One focused task per subagent — never multiplex unrelated work.

**Verify before marking done.** A task is not complete until:
- `npm run build` passes with zero TypeScript errors
- The feature behaves correctly in a browser (for UI changes) or via curl/test (for API changes)
- Relevant docs are updated

---

## Self-Improvement Loop

After every correction from the user:

1. Identify the class of mistake (not just the instance)
2. Append to `docs/lessons.md` using this format **exactly**:
   ```
   ### [Date] Mistake: [short label]
   **Rule:** [the general rule to follow going forward]
   **Why:** [what went wrong and why this rule prevents it]
   ```
3. Grep for sibling occurrences of the same mistake in the codebase
4. Fix any siblings before closing the task

Never skip the lessons.md append. This is the memory system.

---

## MCP Rule

Before implementing or updating any library feature, use the **Context7 MCP** to fetch current documentation. Do not rely on training-data knowledge for library-specific syntax or APIs. This applies to:

- Ollama API (chat completions, streaming, JSON mode, vision)
- Next.js 14 App Router (server components, streaming, route handlers)
- Zod (schemas, refinements, transforms)
- Framer Motion (whileInView, AnimatePresence, useScroll)
- @anthropic-ai/sdk (if referencing old patterns during migration)

Command pattern: use `mcp__context7__resolve-library-id` then `mcp__context7__get-library-docs`.

---

## Project-Specific Rules

### Ollama Configuration
- Ollama runs at `http://localhost:11434`, model is `gemma4:26b`
- **Never hardcode** the base URL or model name anywhere in source code
- Always read from environment variables:
  - `OLLAMA_BASE_URL` — the base URL
  - `OLLAMA_MODEL` — the model identifier
- These must be set in `.env` (server-side only — never prefix with `NEXT_PUBLIC_`)

### AI Call Routing
- **All AI calls must go through `lib/ai/client.ts`** — never call Ollama directly from route files, components, or any other lib file
- Route files call `lib/ai/client.ts` functions; client.ts calls Ollama
- This is the single point of control for timeouts, error handling, and model configuration

### Prompts
- **All prompt strings live in `lib/prompts/`** — never hardcode prompt strings in route files
- `lib/prompts/system.ts` already exists with `buildSystemPrompt()` and status-specific context blocks
- Add new prompt builders to this directory, never inline them

### Safety Requirements (non-negotiable)
- `AbortSignal.timeout(30000)` on **every** Ollama fetch call — no exceptions
- XML delimiter tags (`<user_input>...</user_input>`, `<document>...</document>`, etc.) **required** on all routes that accept user-supplied text interpolated into prompts
- Zod validation **required** on every API route input — schema lives in `lib/validation/schemas.ts`

### JSON Extraction
- `extractJSON()` from `lib/api/anthropic.ts` (will become `lib/ai/client.ts`) handles markdown fences and embedded JSON — always use it, never hand-roll JSON extraction
- After extracting, validate against the route's expected Zod schema before using the data

### Sessions and Persistence
- sessionStorage only (`hb_*` keys) — no database, no server-side persistence
- Defensive array access on all sessionStorage reads (`parsed?.field ?? []`)

---

## Git Discipline

- **Feature branches only** — never commit directly to main
- Branch naming: `feat/phase1-ollama-client`, `fix/chat-streaming`, etc.
- Commit messages must reference the task from `docs/ROADMAP.md`:
  ```
  feat(phase1): create lib/ai/client.ts Ollama wrapper [ROADMAP Phase 1, Task 2]
  ```
- **Never commit `.env`** — it is gitignored; secrets stay local
- Never commit with broken TypeScript (`npm run build` must pass first)
- One logical change per commit

---

## Documentation Maintenance

After every completed module, before marking a task done:

1. Mark the task `[x]` in `docs/ROADMAP.md`
2. Append a dated entry to `docs/changelog.md`:
   ```
   ## [2026-05-05] Phase 1 — lib/ai/client.ts created
   - Created centralized Ollama wrapper with streaming and AbortSignal.timeout
   - Confirmed gemma4:26b responding on localhost:11434
   ```
3. Update `docs/project_status.md`:
   - Move completed item to "What's Done"
   - Update "What's Next" to the next task
   - Update the "Last Updated" date

---

## Codebase Documentation (existing, still applies)

All deep-dive docs: `.planning/codebase/`
- Stack & deps → `@.planning/codebase/STACK.md`
- Architecture & data flows → `@.planning/codebase/ARCHITECTURE.md`
- Naming conventions → `@.planning/codebase/CONVENTIONS.md`
- Directory structure → `@.planning/codebase/STRUCTURE.md`
- Tech debt & security → `@.planning/codebase/CONCERNS.md`
- Animation pitfalls → `@.planning/research/PITFALLS.md`

---

## Things to Never Do

- Never call Ollama directly from a route file or component — always go through `lib/ai/client.ts`
- Never hardcode `http://localhost:11434` or `gemma4:26b` — use environment variables
- Never expose `OLLAMA_BASE_URL` or `OLLAMA_MODEL` to the client (`NEXT_PUBLIC_` prefix is forbidden for these)
- Never skip `AbortSignal.timeout(30000)` on an Ollama call
- Never skip Zod validation on API route input
- Never interpolate user input into a prompt without XML delimiter tags
- Never use `any` — use `unknown` + type guard or a proper type
- Never commit `.env` or `.env.local`
- Never commit with failing TypeScript
- Never start Phase 2 without confirming Phase 1 is `[x]` complete in `docs/ROADMAP.md`
- Never guess on immigration eligibility rules — check NILC / KFF; add `// VERIFY` if uncertain
- Never modify `lib/eligibility/engine.ts` without running the test matrix

---

## Lessons Learned (inherited from original project)

- **sessionStorage shape changes cause silent runtime crashes** — add a validator at the read boundary that detects old shape and clears + redirects
- **Defensive array access on sessionStorage data** — always default to `[]` before `.length`, `.map()`, `.includes()`
- **Missing semicolon before `(`** — ASI does not insert `;` before `(` — add one when next line starts with `(`, `[`, or template literal
- **When fixing one crash, scan for siblings** — grep for all usages before stopping

---

## Session Log

Claude appends a one-line summary after each session.

| Date | Summary |
|------|---------|
| 2026-05-05 | Scaffold created — all documentation and config files initialized for Gemma 4 migration |
