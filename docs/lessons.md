# HealthBridge Gemma — Lessons Learned

Format for every entry:
```
### [Date] Mistake: [short label]
**Rule:** [the general rule to follow going forward]
**Why:** [what went wrong and why this rule prevents it]
```

---

## Inherited from original HealthBridge codebase

### [pre-2026-05-05] Mistake: sessionStorage shape mismatch on type change
**Rule:** Whenever a stored type gains or loses a field, add a validator at the read boundary that detects the old shape and clears + redirects.
**Why:** TypeScript types don't protect runtime data. Old sessionStorage values silently have the wrong shape after a type change, causing crashes.

### [pre-2026-05-05] Mistake: Missing null guard on sessionStorage arrays
**Rule:** Always default arrays read from sessionStorage to `[]` (`parsed?.field ?? []`) before calling `.length`, `.map()`, `.includes()`.
**Why:** TypeScript types don't protect runtime data. Unguarded `.map()` on `undefined` throws immediately.

### [pre-2026-05-05] Mistake: Missing semicolon before line starting with `(`
**Rule:** Add `;` when the next line starts with `(`, `[`, or a template literal.
**Why:** ASI does not insert a semicolon before `(`, so `const x = new Foo()\n(something).method()` is parsed as a function call on the return value of `new Foo()`.

### [pre-2026-05-05] Mistake: Fixing one crash without scanning for siblings
**Rule:** When a field is undefined in one component, grep for all usages before stopping.
**Why:** The same root cause (missing null guard, stale type) typically affects every consumer of that field simultaneously.

---

## Gemma 4 migration lessons (append below as they occur)
