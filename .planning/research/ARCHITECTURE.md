# Architecture Research — v1.1 UI Overhaul

## 1. Lenis Integration with Next.js App Router

**Where to initialize:** `app/providers.tsx` (new file), wrapped in `app/layout.tsx`.

```tsx
// app/providers.tsx
'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true })
    ;(window as any).lenis = lenis
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])
  return <>{children}</>
}
```

**Next.js navigation:** Call `window.lenis?.scrollTo(0)` before route changes to prevent scroll position carrying over.

**Framer Motion `useScroll` pairing:** Lenis controls scroll feel; `useScroll` reads position. They coexist cleanly — no conflict.

---

## 2. Sidebar Navigation Architecture

**Current state:** `app/dashboard/page.tsx` (728 lines) — tab state in `useState`. Not scalable.

**New file structure:**
```
app/dashboard/
  layout.tsx          ← NEW: sidebar wrapper
  page.tsx            ← home overview screen
  explore/page.tsx    ← plans + cost estimator
  tools/page.tsx      ← chat, documents, appeals, network
  help/page.tsx       ← glossary
```

**`app/dashboard/layout.tsx`:**
```tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
```

`components/dashboard/Sidebar.tsx` uses `usePathname()` for active state — no prop drilling needed.

**Mobile:** Sheet drawer at `< 768px`, triggered by hamburger, closes on link click.

**Nav groups:**
```
[Logo]  Home  ─  Recommendation · Plans · Timeline  ─  Chat · Documents · Appeals · Network · Cost  ─  Help
```

---

## 3. Landing Page Refactor

**Current state:** `app/page.tsx` is 728-line monolith.

**Extract into:**
```
components/landing/
  HeroSection.tsx         ← product demo + animated stats
  MarqueeSection.tsx      ← existing marquee
  FeaturesSection.tsx     ← feature cards with reveals
  HowItWorksSection.tsx   ← 3-step process
  FAQSection.tsx          ← accordion
  CTASection.tsx          ← bottom CTA
```

`app/page.tsx` reduces to ~40 lines.

**Scroll reveal hook** (`hooks/useScrollReveal.ts`):
```tsx
export function useScrollReveal() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center start'] })
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])
  const y = useTransform(scrollYProgress, [0, 0.3], [40, 0])
  return { ref, opacity, y }
}
```

**Layout shift prevention:** `will-change: transform, opacity`, delay animations until mounted, reserve hero height with `min-height`.

---

## 4. Onboarding Animation Integration

**Current state:**
- `components/ui/StepTransition.tsx` already has `AnimatePresence mode="wait"` + directional slides ✓
- GSAP installed but not used in onboarding — zero conflict risk

**Add:** Staggered field entrance per step:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05, duration: 0.3 }}
>
  {field}
</motion.div>
```

`StepTransition.tsx` is already optimal — no changes needed.

---

## 5. Design Token Extension

**Current:** `app/globals.css` has 10 brand color tokens only.

**Extend `@theme` block** (no breaking changes — existing Tailwind classes still work):
```css
@theme {
  --color-surface: #f8f7f4;
  --color-surface-raised: #ffffff;
  --color-border: rgb(0 0 0 / 0.08);
  --radius-sm: 0.5rem; --radius-md: 0.75rem; --radius-lg: 1rem; --radius-xl: 1.5rem;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-md: 0 1px 3px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04);
  --duration-fast: 150ms; --duration-base: 250ms; --duration-slow: 400ms;
  --ease-out-expo: cubic-bezier(0.22, 1, 0.36, 1);
}
```

---

## New Files to Create

| File | Purpose |
|------|---------|
| `app/providers.tsx` | Lenis initialization |
| `app/dashboard/layout.tsx` | Persistent sidebar wrapper |
| `components/dashboard/Sidebar.tsx` | Sidebar nav |
| `hooks/useScrollReveal.ts` | Scroll animation hook |
| `components/landing/*.tsx` | Section components (6 files) |
| `components/onboarding/AnimatedField.tsx` | Staggered field entrance |

---

## Implementation Phase Order

1. Foundation — Lenis provider + design tokens
2. Landing page — section extraction + scroll reveals + hero demo
3. Dashboard — sidebar layout + routing + overview screen
4. Onboarding — field stagger + step animations
