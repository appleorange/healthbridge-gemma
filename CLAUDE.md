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

## Testing Rule — Edge Cases on Substantial Changes

Whenever a change touches a type definition, Zod schema, enum value, or API contract, verify that every layer stays in sync:

1. **Type added or changed** → check `lib/validation/schemas.ts` for the matching Zod schema and update it
2. **New enum value** → search for every `z.enum([...])` that covers that field; add the value to each
3. **New API route behavior** → add a test or note the edge cases explicitly; don't rely on TypeScript alone — Zod schemas are runtime and the type system won't catch mismatches
4. **Eligibility engine change** → run the test matrix (`.claude/TASKS.md`) and add any new cases the change introduces

The class of bug to prevent: TypeScript types and Zod schemas drift apart silently. The type compiles clean; the API rejects valid input at runtime; the UI crashes on an unexpected undefined.

**When in doubt, ask:** "Is there a runtime boundary (API route, sessionStorage parse, external input) where this value will be validated separately from the type?" If yes, update that boundary too.

## Subagent Strategy

- Use subagents liberally to keep the main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via parallel subagents
- One focused task per subagent — never multiplex unrelated work into one

## Autonomous Bug Fixing

When given a bug report: just fix it. No hand-holding required from the user.
- Read the error, trace it to the root cause, fix it
- Point at logs, errors, and failing tests — then resolve them
- Zero context switching required from the user
- If CI is failing, go fix the failing tests without being asked how

## Verification Before Done

Never mark a task complete without proving it works:
- Run `npm run build` and check for errors
- Diff behavior between main and your changes when relevant
- Ask: "would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness — don't just say it works

## Self-Improvement Loop

After any correction from the user:
1. **Identify the pattern** — what class of mistake was it? (e.g. missing null guard, stale cache assumption, missing semicolon causing parse ambiguity)
2. **Write a rule** — add it to the relevant section of this file or to `Things to Never Do` below so future sessions don't repeat it
3. **Scan for siblings** — before closing, grep the codebase for other instances of the same mistake and fix them proactively
4. **Review at session start** — re-read this file at the start of every session and apply any lessons that are relevant to the work at hand

### Lessons learned

- **sessionStorage shape changes cause silent runtime crashes** — whenever `EligibilityResult` or any stored type gains or loses a field, add a validator at the read boundary (e.g. Sidebar) that detects old shape and clears + redirects. Never assume stored data matches the current type.
- **Defensive array access on data from sessionStorage** — always default arrays read from sessionStorage to `[]` (`parsed?.field ?? []`) before calling `.length`, `.map()`, `.includes()`, `.forEach()`. TypeScript types don't protect runtime data.
- **Missing semicolon before a line starting with `(`** — ASI does not insert a semicolon before `(`, so `const x = new Foo()\n(something).method()` is parsed as `new Foo()(something).method()`. Always add `;` when the next line starts with `(`, `[`, or a template literal.
- **When fixing one crash, scan for siblings** — if a field is undefined in one component, it will be undefined in every component that reads it. Grep for all usages before stopping.

## Things to Never Do
- Never add a database, ORM, or user auth without explicit discussion
- Never commit secrets or `.env.local`
- Never use `any` — use `unknown` + type guard or a proper type
- Never skip `npm run build` verification after logic changes
- Never modify `lib/eligibility/engine.ts` without also running the test matrix in `.claude/TASKS.md`
- Never guess on immigration eligibility rules — check NILC / KFF sources; add a `// VERIFY` comment if uncertain
