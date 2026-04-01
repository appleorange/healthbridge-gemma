# UI Overhaul Pitfalls & Gotchas

> Critical failure modes to avoid during v1.1 implementation.

---

## 1. Lenis Smooth Scroll

### 1.1 Conflicts with Next.js Scroll Restoration

**What goes wrong:** Next.js auto-saves/restores scroll position on route changes. Lenis also manages scroll position. Race condition → janky scroll or unexpected position jumps.

**Fix:**
```tsx
useEffect(() => {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }
  const lenis = new Lenis({ autoRaf: true })
  return () => {
    lenis.destroy()
    window.history.scrollRestoration = 'auto'
  }
}, [])
```

### 1.2 Memory Leaks on Unmount

**What goes wrong:** Missing cleanup in `useEffect` → multiple RAF loops accumulate across navigations → sluggish tab after 5-10 page changes.

**Fix:** Always return cleanup:
```tsx
const lenisRef = useRef<Lenis | null>(null)
useEffect(() => {
  const lenis = new Lenis({ autoRaf: true })
  lenisRef.current = lenis
  return () => { lenis.destroy(); lenisRef.current = null }
}, [])
```

### 1.3 iOS Touch Conflict

**What goes wrong:** Lenis's RAF loop interrupts native iOS momentum scroll → jerky, sticky feel on mobile.

**Fix:** Disable Lenis on touch devices under 768px:
```tsx
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
if (isTouchDevice && window.innerWidth < 768) return // skip Lenis
```

### 1.4 Sticky/Fixed Element Issues

**What goes wrong:** Lenis internally uses `transform` on a wrapper container. `position: sticky` elements inside can misbehave. Fixed elements are safe (they ignore transforms), but `getBoundingClientRect()` can return wrong values.

**Fix:** Keep the fixed header **outside** any Lenis-controlled container. Use Framer Motion `useScroll()` for scroll-linked behavior — it reads from actual `window.scrollY`.

### 1.5 Route Change Not Resetting Scroll

**What goes wrong:** Lenis persists across routes (it's in a layout). New page loads at old scroll position.

**Fix:** Use `usePathname()` to reset on navigation:
```tsx
const pathname = usePathname()
useEffect(() => {
  window.scrollTo(0, 0)
  lenisRef.current?.scrollTo(0, { immediate: true })
}, [pathname])
```

---

## 2. Framer Motion `whileInView`

### 2.1 SSR Hydration Mismatches

**What goes wrong:** Server renders `opacity: 0` (initial state) in HTML. Client hydrates and immediately applies `whileInView` state, causing a flash or incorrect state for elements in the viewport on load.

**Fix:** Gate animations behind a `mounted` state:
```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])

<motion.div
  initial={mounted ? { opacity: 0, y: 20 } : undefined}
  whileInView={mounted ? { opacity: 1, y: 0 } : undefined}
  viewport={{ once: true, amount: 0.3 }}
>
```

Or test with `next build && next start` — `next dev` hides SSR issues.

### 2.2 Layout Shift (CLS)

**What goes wrong:** Animating `height`, `width`, `margin`, `padding` → reflow → CLS. Core Web Vital penalty.

**Rule:** Only animate GPU-accelerated properties: `opacity`, `transform` (scale, translate, rotate). Never animate layout properties.

```tsx
// ✅ Safe
initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}

// ❌ Causes CLS
initial={{ height: 0 }} whileInView={{ height: 'auto' }}
```

### 2.3 `once: true` Not Holding

**What goes wrong:** Component unmounts and remounts (conditional render, key change) → `once: true` resets because a new IntersectionObserver is created.

**Fix:** If persistence matters, track in `sessionStorage`:
```tsx
const [hasAnimated] = useState(() =>
  typeof window !== 'undefined' && !!sessionStorage.getItem('animated-hero')
)
// onAnimationComplete: sessionStorage.setItem('animated-hero', '1')
```

### 2.4 `AnimatePresence` Key Conflicts

**What goes wrong:** Using `key={index}` on list items → animations fire on wrong elements when list reorders → ghost exit animations, jank.

**Fix:** Always use stable unique IDs as keys. **Never** use array index as key in `AnimatePresence`.

---

## 3. Sidebar Navigation

### 3.1 Full Page Re-renders on Route Change

**What goes wrong:** Sidebar uses `usePathname()` → re-renders on every route change → triggers all sidebar child re-renders, replays animations.

**Fix:** Wrap sidebar in `React.memo()` and extract the active-state logic into a memoized sub-component:
```tsx
const Sidebar = memo(function Sidebar() {
  const pathname = usePathname()
  return <nav>...</nav>
})
```

### 3.2 iOS Viewport Height Bug (`h-screen`)

**What goes wrong:** `h-screen` = `100vh` on iOS includes the browser chrome (address bar). Sidebar is taller than visible area → bottom nav items cut off.

**Fix:**
```css
/* globals.css */
.sidebar { height: 100dvh; } /* dvh = dynamic viewport height */
```
Or in Tailwind: `h-[100dvh]`. The `dvh` unit adjusts when the browser chrome hides/shows.

### 3.3 Mobile Sheet Not Closing on Navigation

**What goes wrong:** Sheet (mobile drawer) doesn't close when user taps a nav link → user sees drawer over new page content.

**Fix:** Pass `onClose` callback to nav items and call it inside `onClick`:
```tsx
<Link href={href} onClick={() => onClose?.()}>
```
Or use `usePathname()` change in a `useEffect` to auto-close the sheet.

### 3.4 Z-index Wars

**What goes wrong:** Sidebar z-index conflicts with modals, tooltips, toast notifications.

**Fix:** Establish z-index scale in design tokens:
```
sidebar: z-30
modal: z-50
toast: z-60
tooltip: z-70
```

---

## 4. Design Tokens in Tailwind v4

### 4.1 Naming Collisions with Existing Variables

**What goes wrong:** Adding `--color-surface` to `@theme` may shadow a Tailwind built-in or an existing token → unexpected color changes.

**Fix:** Before adding, grep for existing uses of the variable name:
```bash
grep -r "color-surface\|--color-surface" app/ components/
```

### 4.2 JIT Purging Unused Tokens

**What goes wrong:** Tokens defined in `@theme` but only referenced in CSS (not in JSX `className`) may be purged in production builds.

**Fix:** Use tokens in at least one `className` string that Tailwind can detect, or explicitly safelist them in `tailwind.config.ts`.

---

## 5. Performance

### 5.1 `will-change` Overuse

**What goes wrong:** Adding `will-change: transform` to many elements simultaneously → GPU layer exhaustion → scroll performance degrades on mid-range devices.

**Fix:** Only apply `will-change` to actively animating elements. Remove it after animation completes via `onAnimationComplete`. Never set `will-change` globally.

### 5.2 `useScroll` + `useTransform` Re-renders

**What goes wrong:** Using `useScroll` in a parent component + passing `scrollYProgress` down as a prop → every scroll tick triggers re-renders through the prop chain.

**Fix:** Use `useScroll` only in the component that directly uses `useTransform`. Framer Motion values (`MotionValue`) don't cause re-renders when read via `style={{ y }}` — only when you read them in JS (`.get()`).

### 5.3 Framer Motion Bundle Size

**What goes wrong:** Importing from `framer-motion` directly includes the full bundle. In Next.js, this ends up in the client bundle even for server-rendered pages.

**Fix:** Already handled by `'use client'` directive. Ensure animated components are client components. Avoid importing Framer Motion in server components.

---

## Quick Reference

| Pitfall | Fix in one line |
|---------|-----------------|
| Lenis + Next.js scroll restore conflict | Set `window.history.scrollRestoration = 'manual'` |
| Lenis memory leak | Always `return () => lenis.destroy()` in `useEffect` |
| Lenis on iOS mobile | Skip Lenis for touch devices < 768px |
| Scroll not resetting on route change | `usePathname()` → `lenis.scrollTo(0, { immediate: true })` |
| SSR hydration flash | Gate `initial`/`whileInView` behind `mounted` state |
| CLS from animations | Only animate `opacity` + `transform`, never layout props |
| `once: true` breaks on remount | Store animation state in `sessionStorage` |
| Ghost animations in AnimatePresence | Use stable unique IDs as keys, never array index |
| Sidebar re-renders on nav | `React.memo()` on Sidebar component |
| iOS `h-screen` cutting off content | Use `h-[100dvh]` instead of `h-screen` |
| Z-index wars | Establish z-index scale in design tokens |
| `will-change` GPU exhaustion | Only apply during animation, remove after |
