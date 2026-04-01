# Requirements — v1.1 UI Overhaul

> Scoped from research phase. Each requirement has an ID for roadmap tracking.

---

## Phase 1: Foundation

| ID | Requirement | Notes |
|----|-------------|-------|
| REQ-001 | Install `lenis` and `use-count-up` packages | `npm install lenis use-count-up` |
| REQ-002 | Create `app/providers.tsx` with LenisProvider | `autoRaf: true`, cleanup on unmount, scroll reset on route change, disabled on touch < 768px |
| REQ-003 | Wrap `app/layout.tsx` with Providers | Lenis wraps entire app |
| REQ-004 | Extend `app/globals.css` `@theme` block with design tokens | Surface colors, radius scale, shadow scale, motion tokens — no breaking changes |

---

## Phase 2: Landing Page

| ID | Requirement | Notes |
|----|-------------|-------|
| REQ-005 | Extract `app/page.tsx` into `components/landing/` section components | 6 sections: Hero, Marquee, Features, HowItWorks, FAQ, CTA |
| REQ-006 | `app/page.tsx` reduces to ~40 lines (imports + assembly) | |
| REQ-007 | Create `hooks/useScrollReveal.ts` | `useScroll` + `useTransform` → `{ ref, opacity, y }` |
| REQ-008 | Add scroll-triggered reveals to Features, HowItWorks, CTA sections | `whileInView`, `once: true`, `viewport: { amount: 0.3 }`, ease-out-expo easing, stagger children |
| REQ-009 | Add animated stats counter to Hero section | `use-count-up` hook, triggered when stats section enters viewport |
| REQ-010 | Add product demo to Hero section | Cycling screenshots (onboarding → recommendation → plan card) via `AnimatePresence`, 3-4s interval |
| REQ-011 | Gate all animations behind `mounted` state to prevent SSR hydration flash | |

---

## Phase 3: Dashboard

| ID | Requirement | Notes |
|----|-------------|-------|
| REQ-012 | Create `app/dashboard/layout.tsx` with persistent sidebar | Sidebar + `<main className="flex-1 overflow-y-auto">{children}</main>` |
| REQ-013 | Create `components/dashboard/Sidebar.tsx` | `React.memo`, `usePathname` for active state, nav groups with dividers |
| REQ-014 | Mobile: Sheet drawer at < 768px | Triggered by hamburger, closes on link click, `h-[100dvh]` not `h-screen` |
| REQ-015 | Migrate dashboard routes to sub-pages | `page.tsx` → Home overview; `explore/page.tsx` → Plans + Cost; `tools/page.tsx` → Chat + Docs + Appeals + Network; `help/page.tsx` → Glossary |
| REQ-016 | Create dashboard Home overview screen | Shows: recommendation summary, next enrollment deadline, cost estimate snapshot |
| REQ-017 | Remove tab-based navigation from `app/dashboard/page.tsx` | Replaced by sidebar + routing |

---

## Phase 4: Onboarding

| ID | Requirement | Notes |
|----|-------------|-------|
| REQ-018 | Create `components/onboarding/AnimatedField.tsx` | Staggered entrance per field: `delay: index * 0.05`, `duration: 0.3`, `y: 20 → 0` |
| REQ-019 | Wrap form fields in `AnimatedField` per onboarding step | Applied to each step's visible fields |
| REQ-020 | Verify `StepTransition.tsx` directional slides still work | Already optimal per research — no changes needed unless issues found |

---

## Constraints (carry forward)

- Only animate GPU-accelerated properties: `opacity`, `transform`
- Gate all `whileInView` animations behind `mounted` state
- `prefers-reduced-motion`: wrap all animation variants with media query check
- No new heavy dependencies beyond `lenis` and `use-count-up`
- Sidebar must use `React.memo` to prevent full re-renders on route change
- Use `h-[100dvh]` everywhere instead of `h-screen` for sidebar height
- All `AnimatePresence` list items must use stable unique IDs as keys

---

## Out of Scope (v1.1)

| Item | Reason |
|------|--------|
| Collapsible sidebar | Nice-to-have; adds complexity for MVP |
| Animated sliding nav indicator (pill) | Nice-to-have; can add in v1.2 |
| Text character splitting (split-type) | Only if needed for specific hero text |
| Parallax scroll on hero mockup | Included only if hero demo looks flat without it |
| SVG path drawing animations | No SVGs identified that need this |
