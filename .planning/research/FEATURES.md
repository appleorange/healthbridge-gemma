# Features Research — v1.1 UI Overhaul

> **Key meta-finding (2026):** SaaS design has shifted from visual embellishment toward purposeful motion + clarity. The hierarchy that drives conversions: clear value prop > product visuals > micro-interactions > polish > animation. Animation alone doesn't convert — context does.

---

## 1. Scroll-Triggered Landing Page Sections

### Table Stakes (must-have)
- Entrance animations on scroll: fade + translate-y (opacity 0→1, y 40→0)
- `once: true` — elements don't re-animate on scroll back up
- `viewport: { amount: 0.2–0.3 }` — trigger when 20–30% visible
- GPU-only transforms: `opacity`, `transform` (translateY, scale) — never animate `height`, `top`, `margin`
- `prefers-reduced-motion` fallback: disable transforms, keep opacity-only or no animation

### Differentiators (what makes it great)
- **Macro stagger:** entire sections enter with stagger (hero → stats → features → CTA)
- **Micro stagger:** within a section, cards/items enter sequentially (staggerChildren: 0.08–0.12s)
- **Parallax depth:** background elements scroll slower than foreground (useTransform with different multipliers)
- **Scroll-linked progress:** a subtle progress bar or section indicator tied to scroll position
- **Easing:** `[0.22, 1, 0.36, 1]` cubic-bezier (ease out expo) feels premium vs default ease

### Anti-features (amateur signals)
- Animating on every scroll (not `once: true`) — dizzying
- Bounce/elastic easing on entrance — looks playful, not professional
- Too many simultaneous animations — cognitive overload
- Animating layout properties (height, padding) — causes reflow jank
- Entrance delay > 300ms — feels broken

### Section structure (Linear/Vercel pattern)
```
Hero → [immediate, no scroll trigger]
Stats bar → [fade in as section enters]
Feature grid → [stagger cards left-to-right]
Product demo → [scroll-linked parallax]
Testimonials → [fade up]
CTA → [scale + fade]
```

---

## 2. Animated Product Demo in Hero

### Table Stakes
- Show the actual product UI (not an illustration)
- Static screenshot with subtle entrance animation at minimum
- Mobile-responsive (stack vertically on small screens)

### Differentiators
- **Parallax layers:** device frame + UI screenshot + background shadow as separate layers, each scrolling at different rates
- **Scroll-reveal:** UI screenshot clips in from bottom as user scrolls past hero
- **Animated state transitions:** show 2–3 states of the product cycling on a timer (e.g., onboarding step → recommendation screen → plan card)
- **Browser/device frame:** wrapping the screenshot in a macOS window or browser chrome adds realism

### Anti-features
- Live iframe of actual app — too heavy, causes layout shift
- Looping video — autoplay issues on mobile, bandwidth
- Illustration instead of real UI — reduces trust
- Too many UI states cycling too fast — distracting

### Implementation for HealthBridge
Best approach: static PNG screenshots of key screens (onboarding, recommendation, plan card) + Framer Motion `AnimatePresence` to cycle between them every 3–4s + parallax scroll on the container.

---

## 3. Sidebar Navigation for Dashboard

### Table Stakes
- Persistent left sidebar (desktop) with icon + label per nav item
- Active state clearly indicated (background highlight + color change)
- Route-based active detection (`usePathname`)
- Mobile: collapse to bottom nav bar or hamburger → Sheet drawer
- Smooth transition when switching sections

### Differentiators
- **Collapsible:** sidebar can collapse to icon-only mode (saves space, feels professional)
- **Section grouping:** primary tools vs secondary tools separated by a divider
- **Subtle hover states:** icon scale + background on hover
- **Animated active indicator:** sliding pill or bar that moves between items
- **User context in footer:** show the user's status or profile summary at bottom of sidebar

### Anti-features
- No mobile fallback — sidebar breaks on small screens
- Sidebar that rerenders on every route change
- Too many nav items (>7) — use groups or hide secondary items
- Active state that's too subtle — users don't know where they are

### Structure for HealthBridge dashboard
```
Sidebar:
  [Logo/brand]
  ─────────────
  Home (overview)
  Recommendation
  Plans
  Timeline
  ─────────────
  Chat
  Documents
  Appeals
  Network
  Cost Estimator
  ─────────────
  Help / Glossary
```

### App Router implementation
Use a shared layout file `app/dashboard/layout.tsx` with the sidebar as a persistent element — page content renders in `{children}`. No prop drilling needed.

---

## 4. Animated Multi-Step Onboarding Form

### Table Stakes
- Clear step progress indicator (numbered steps or progress bar)
- Smooth transition between steps (slide or fade)
- Input validation feedback before allowing Next
- Back button that remembers previous values
- Loading state on final submit

### Differentiators
- **Directional slides:** forward = slide left, back = slide right (matches user's mental model)
- **Spring physics:** `type: 'spring', stiffness: 300, damping: 30` feels physical and responsive
- **Field micro-interactions:** input border animates to brand color on focus, check icon appears on valid input
- **Step completion celebration:** subtle checkmark animation when a step is complete
- **Progress bar fills** as steps complete (not just step counter)

### Anti-features
- Fade-only transitions — boring, no sense of direction
- Validation only on submit — frustrating UX
- No progress indicator — users don't know how far they are
- Overly complex animations between steps — users just want to fill out the form

### Implementation
Use Framer Motion `AnimatePresence` with a `direction` state variable:
```tsx
<AnimatePresence custom={direction} mode="wait">
  <motion.div
    key={step}
    custom={direction}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
  >
    <StepComponent />
  </motion.div>
</AnimatePresence>
```

---

## 5. Visual Identity Consistency

### Table Stakes
- All colors from a single token set (no ad-hoc hex values)
- Consistent spacing scale (4px base unit: 4, 8, 12, 16, 24, 32, 48, 64)
- Consistent border radius scale (sm: 8px, md: 12px, lg: 16px, xl: 24px)
- Typography scale: 3–4 sizes max with consistent weights
- Consistent shadow scale (1–3 levels)

### Differentiators
- **Tailwind v4 `@theme` block** — define all design tokens as CSS variables in one place
- **Semantic token layer:** `--color-surface`, `--color-surface-raised`, `--color-border` mapped on top of brand palette — easier to maintain than raw color values
- **Component variants via CVA (class-variance-authority):** consistent button/card/input variants without duplication
- **Motion tokens:** standardized animation durations and easings as CSS variables or JS constants

### Anti-features
- Mixing Tailwind utilities with ad-hoc `style={}` props for colors — breaks consistency
- Multiple shades of "white" backgrounds with no clear hierarchy
- Inconsistent border-radius (some rounded-lg, some rounded-2xl, some rounded-full with no pattern)
- Typography that uses too many font weights

### Tailwind v4 token approach
```css
@theme {
  --color-surface: #f8f7f4;
  --color-surface-raised: #ffffff;
  --color-surface-overlay: #eeeee8;
  --color-border: oklch(88% 0.02 145);
  --radius-card: 1rem;
  --radius-button: 0.75rem;
  --shadow-card: 0 1px 3px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04);
}
```
