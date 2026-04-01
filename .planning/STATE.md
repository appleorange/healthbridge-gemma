# HealthBridge — State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-03-31)

**Core value:** Help anyone navigate US health insurance confidently, regardless of immigration status — in minutes, not hours.
**Current focus:** Defining requirements for v1.1 UI Overhaul

## Current Position

Phase: Ready to implement — Phase 1: Foundation
Plan: `.planning/ROADMAP.md`
Status: Research complete (4/4). Requirements + Roadmap written. Ready to build.
Last activity: 2026-03-31 — Requirements defined, roadmap created

## Accumulated Context

- Codebase fully mapped in `.planning/codebase/` (7 documents)
- Animation stack already in place: Framer Motion, GSAP, SpotlightCard, cursor glow, mesh gradient
- Reference site: Adaline.ai (scroll-triggered, Lenis, product demo in hero)
- User wants: landing page overhaul + dashboard sidebar + better onboarding + visual identity
- Dashboard recommendation: sidebar nav + home overview screen (scales better than tabs)
- No tests, no CI — iterating fast
- 20 requirements across 4 phases (REQ-001 → REQ-020)
- PITFALLS.md written — key gotchas: Lenis iOS/memory/route-reset, SSR hydration, `h-[100dvh]`, `React.memo` on sidebar
