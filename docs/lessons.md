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

### [2026-05-06] Mistake: 30s timeout assumption broken by extended-thinking mode
**Rule:** Always pass `think: false` in every Ollama request body when using `gemma4:e4b`. Always set `OLLAMA_TIMEOUT_MS` to at least 120000 in `.env` for non-streaming calls on this hardware.
**Why:** Gemma 4 defaults to extended-thinking mode, which generates `"thinking"` tokens before any `"content"` tokens. On this machine (~0.18 tok/s CPU inference), the thinking phase alone exceeds 30 seconds. `think: false` disables it and content starts immediately. Non-streaming still needs 120s+ because the full response at 0.18 tok/s takes 60-120s for typical JSON outputs.

### [2026-05-06] Mistake: same timeout used for streaming and non-streaming Ollama calls
**Rule:** Use separate timeout constants for streaming vs non-streaming in `lib/ai/client.ts`. Non-streaming: `OLLAMA_TIMEOUT_MS` (120s+). Streaming: `OLLAMA_STREAM_TIMEOUT_MS` (300s+). Frontend streaming fetches must also use a long timeout (300s), not the same short value used for one-shot requests.
**Why:** A 30s `AbortSignal.timeout` fires mid-stream for responses that take >30s to fully generate, causing "BodyStreamBuffer was aborted" errors in the browser. Streaming start latency (~8s) is fast; full generation is slow — different timeouts are needed.

### [2026-05-06] Mistake: conflating "API returned empty" with "offline" in fallback logic
**Rule:** Only serve the static offline cache when a fetch throws (network error / TypeError). If the API returns a non-2xx status or an empty result set, show mocked estimated plans with `cached:false` — not the offline cache with `cached:true`.
**Why:** An invalid API key (401) or rate limit (429) makes `fetchACAPlans` return `[]`, which was indistinguishable from a network failure. This triggered the "Showing sample plans — connect to internet" banner even when the user was fully online. The distinction requires letting TypeErrors propagate out of the fetch wrapper rather than swallowing all errors in a single catch block.
