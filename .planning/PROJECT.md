# HealthBridge

## What This Is

HealthBridge is an AI-powered health insurance navigator for US residents — especially immigrants and visa holders. Users answer a short questionnaire about their immigration status, employment, income, and health needs, then get a personalized insurance recommendation, real ACA plan comparisons, an enrollment timeline, and tools to parse documents, check provider networks, and appeal claim denials.

## Core Value

Help anyone navigate US health insurance confidently, regardless of immigration status or background — in minutes, not hours.

## Current Milestone: v1.1 UI Overhaul

**Goal:** Transform HealthBridge from functional to visually memorable — animated landing page and polished app UI.

**Target features:**
- Landing page: Lenis smooth scroll, scroll-triggered section reveals, hero combining animated product demo + animated stats
- Dashboard: sidebar navigation + home overview screen (recommendation, next deadline, cost estimate)
- Onboarding: more engaging animated multi-step form
- Visual identity: consistent design language across all screens

## Requirements

### Validated

- ✓ Multi-step onboarding questionnaire with conditional fields
- ✓ Eligibility engine covering 14+ immigration status categories
- ✓ ACA plan recommendations with fit scoring via Healthcare.gov API
- ✓ Claude-powered chat assistant with session persistence
- ✓ Insurance document parser (PDF/image vision)
- ✓ Enrollment timeline generator
- ✓ Cost estimator with subsidy calculations
- ✓ Appeal assistant (analyze denial → draft letter)
- ✓ Provider network checker
- ✓ Plan comparison tool

### Active

- [ ] Animated, scroll-triggered landing page with Lenis smooth scroll
- [ ] Hero section: product demo animation + animated stats
- [ ] Dashboard sidebar navigation replacing tab bar
- [ ] Dashboard home overview screen
- [ ] Animated onboarding multi-step form
- [ ] Consistent visual identity across all screens

### Out of Scope

| Feature | Reason |
|---------|--------|
| User authentication | Privacy-by-design; sessionStorage-only is intentional for v1 |
| Backend database | No server persistence by design |
| Mobile app | Web-first |
| Real-time notifications | No auth/accounts to attach them to |

## Context

- **Stack:** Next.js 14, React 18, Tailwind CSS v4, Framer Motion, GSAP, Anthropic Claude API
- **Animation already in place:** Framer Motion entrance animations, GSAP on onboarding, SpotlightCard hover effects, mesh gradient background, cursor glow
- **Reference:** Adaline.ai — scroll-triggered reveals, Lenis smooth scroll, product demo embedded in landing page
- **Brand palette:** Green theme (brand-500: #588157, brand-600: #3a5a40) on off-white (#eeeee8) background
- **No tests, no CI** — iterating fast; test coverage is a future concern

## Constraints

- **Tech stack:** Next.js + Tailwind + Framer Motion + GSAP — stay within these, no new heavy deps unless justified
- **Performance:** Animations must not block LCP; use GPU-accelerated transforms only
- **Accessibility:** Respect `prefers-reduced-motion`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sidebar nav over tab bar | Scales better as features grow; standard for tool-heavy SaaS | — Pending |
| Lenis for smooth scroll | Already used in reference; pairs well with Framer Motion scroll hooks | — Pending |
| sessionStorage only (no DB) | Privacy-by-design; free hosting without infrastructure | ✓ Good |
| Claude Sonnet for all AI routes | Balance of quality and cost for health insurance guidance | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-31 — Milestone v1.1 started*
