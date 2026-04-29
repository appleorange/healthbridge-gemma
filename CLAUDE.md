# HealthBridge — Claude Working Instructions

## Codebase Documentation
All deep-dive docs live in `.planning/codebase/`. Read the relevant file before making changes:

- **Stack & deps** → @.planning/codebase/STACK.md
- **Architecture & data flows** → @.planning/codebase/ARCHITECTURE.md
- **Naming conventions & patterns** → @.planning/codebase/CONVENTIONS.md
- **Directory structure** → @.planning/codebase/STRUCTURE.md
- **Known tech debt & security concerns** → @.planning/codebase/CONCERNS.md
- **Animation pitfalls (Lenis, Framer Motion)** → @.planning/research/PITFALLS.md
- **Project goals & milestone history** → @.planning/PROJECT.md

## Tech Stack (quick ref)
Next.js 14 App Router · React 18 · TypeScript (strict) · Tailwind CSS v4 · Framer Motion · GSAP · Anthropic Claude API (`claude-sonnet-4-6`)

## Key Architecture Rules
1. **Zero server persistence** — sessionStorage only (`hb_*` keys). Never introduce a database or auth without explicit approval.
2. **Types are the contract** — all shared types live in `types/index.ts`. Adding a field means updating that file first.
3. **`lib/` is pure** — no I/O, no side effects in `lib/`. API routes call `lib/` functions; `lib/` functions never call fetch.
4. **Eligibility rules live in `lib/eligibility/rules.ts`** — policy constants (state lists, eligible statuses) are data, not logic. Update the config file, not the engine function.
5. **`@/*` alias** — always import via `@/` path alias, never relative `../` paths.
6. **`import type`** — use `import type` for TypeScript-only imports.

## Workflow Loop
For any non-trivial change:
1. **Explore** — read relevant files before writing anything
2. **Plan** — state what you'll change and why; confirm if approach is non-obvious
3. **Execute** — make targeted edits; prefer Edit over Write on existing files
4. **Verify** — run `npm run build` after every change; fix any TypeScript errors before stopping

## Commit Standards (Conventional Commits)
```
feat:     new user-facing feature
fix:      bug fix
refactor: code change with no behavior change
docs:     documentation only
chore:    build/tooling/deps
test:     adding or fixing tests
```
Scope optional: `fix(eligibility): implement LPR 5-year bar`

One logical change per commit. Never commit `.env.local`.

## Session Hygiene

### Closing Ritual (do this at the end of EVERY session)
Before any /clear or session end:
1. Update `.claude/TASKS.md` — mark completed tasks ✅, move anything discovered to backlog
2. Run `npm run build` and `npm run lint` — confirm clean
3. Suggest a Conventional Commit message for everything done this session
4. Remind me to /clear

Do not let me end a session without prompting this checklist if we wrote any code.

## Things to Never Do
- Never add a database, ORM, or user auth without explicit discussion
- Never commit secrets or `.env.local`
- Never use `any` — use `unknown` + type guard or a proper type
- Never skip `npm run build` verification after logic changes
- Never modify `lib/eligibility/engine.ts` without also running the test matrix in `.claude/TASKS.md`
- Never guess on immigration eligibility rules — check NILC / KFF sources; add a `// VERIFY` comment if uncertain
