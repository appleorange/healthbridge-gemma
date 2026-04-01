# Roadmap — v1.1 UI Overhaul

## Phase 1: Foundation
**Goal:** Install dependencies and establish design system. Zero visual changes to existing UI — only additive.

| Step | Task | REQ |
|------|------|-----|
| 1.1 | `npm install lenis use-count-up` | REQ-001 |
| 1.2 | Create `app/providers.tsx` — LenisProvider with cleanup, route reset, mobile disable | REQ-002 |
| 1.3 | Wrap `app/layout.tsx` with `<Providers>` | REQ-003 |
| 1.4 | Extend `app/globals.css` `@theme` block with design tokens (surface, radius, shadow, motion) | REQ-004 |

**Done when:** `npm run build` passes. Lenis active on landing page. No visual regressions.

---

## Phase 2: Landing Page
**Goal:** Animated, scroll-triggered landing page with hero demo + stats.

| Step | Task | REQ |
|------|------|-----|
| 2.1 | Create `hooks/useScrollReveal.ts` | REQ-007 |
| 2.2 | Extract landing page into 6 section components in `components/landing/` | REQ-005, REQ-006 |
| 2.3 | Add `whileInView` scroll reveals to Features, HowItWorks, CTA sections | REQ-008 |
| 2.4 | Add animated stats counters to Hero | REQ-009 |
| 2.5 | Add product demo (cycling screenshots) to Hero | REQ-010 |
| 2.6 | Audit all animations for SSR safety (mounted gate) | REQ-011 |

**Done when:** Landing page has scroll-triggered reveals, animated stats, cycling hero demo. No CLS. Works with `prefers-reduced-motion`.

---

## Phase 3: Dashboard
**Goal:** Sidebar navigation replacing tab bar. New home overview screen.

| Step | Task | REQ |
|------|------|-----|
| 3.1 | Create `app/dashboard/layout.tsx` with sidebar wrapper | REQ-012 |
| 3.2 | Create `components/dashboard/Sidebar.tsx` (memoized, pathname-based active state) | REQ-013 |
| 3.3 | Add mobile Sheet drawer to Sidebar | REQ-014 |
| 3.4 | Create dashboard sub-pages: `explore/`, `tools/`, `help/` | REQ-015 |
| 3.5 | Move existing tab content into corresponding sub-pages | REQ-015 |
| 3.6 | Build `app/dashboard/page.tsx` as Home overview screen | REQ-016 |
| 3.7 | Remove tab state from old `dashboard/page.tsx` | REQ-017 |

**Done when:** Dashboard has persistent sidebar. All existing tools accessible via routing. Home overview shows recommendation + deadline + cost. Mobile drawer works.

---

## Phase 4: Onboarding
**Goal:** More engaging animated multi-step form.

| Step | Task | REQ |
|------|------|-----|
| 4.1 | Create `components/onboarding/AnimatedField.tsx` | REQ-018 |
| 4.2 | Apply `AnimatedField` wrapper to form fields in each onboarding step | REQ-019 |
| 4.3 | Verify `StepTransition.tsx` directional slides — fix if needed | REQ-020 |

**Done when:** Fields stagger in on each step change. Step transitions feel directional and physical.

---

## Completion Criteria

- [ ] All 20 requirements implemented
- [ ] `npm run build` passes clean (no TypeScript errors)
- [ ] Landing page: scroll reveals, hero demo, animated stats
- [ ] Dashboard: sidebar nav, home overview, all tools accessible
- [ ] Onboarding: field stagger animations
- [ ] No visual regressions on existing features
- [ ] `prefers-reduced-motion` respected
- [ ] Mobile (< 768px) tested
