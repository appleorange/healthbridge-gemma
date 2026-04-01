# Stack Research — v1.1 UI Overhaul

## 1. Lenis Smooth Scroll

**Package:** `lenis`
**Version:** 1.3.21 (latest stable, March 2026)
**Install:** `npm install lenis`

**Why it fits:**
- Zero dependencies, ~15KB gzipped
- Works with Framer Motion v12's `useScroll()` — no conflicts
- Respects `prefers-reduced-motion` natively
- Full Next.js App Router support via `'use client'`

**Integration pattern:**
```tsx
// components/providers/LenisProvider.tsx
'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'

export function LenisProvider({ children }) {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true })
    return () => lenis.destroy()
  }, [])
  return <>{children}</>
}
```

**Key gotchas:**
- Set `autoRaf: true` to avoid conflicts with Framer Motion's animation loop
- Stop/restart on Next.js route changes using `useLenis()` hook
- Wrap in root layout, not per-page

---

## 2. Scroll-Triggered Animations

**Winner:** Framer Motion v12 `whileInView` + `useScroll()` (already installed at 12.38.0)

**Why over GSAP ScrollTrigger:**
- Hardware-accelerated via browser ScrollTimeline API
- Simpler API, already in the stack
- 32KB vs GSAP's 48KB
- Declarative — works directly in JSX

**Standard reveal pattern:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
>
```

**When to use GSAP ScrollTrigger instead:** pixel-perfect pinning, complex multi-element timelines, SVG path drawing.

**Stagger pattern for groups:**
```tsx
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
}
```

---

## 3. Animated Number Counters

**Package:** `use-count-up`
**Version:** 3.0.1
**Install:** `npm install use-count-up`

**Why:** Lightweight hook-based, SSR-compatible, zero dependencies, stable.

**Usage:**
```tsx
import { useCountUp } from 'use-count-up'
const { value } = useCountUp({ isCounting, end: 14, duration: 2 })
```

**Skip:** `react-countup` (larger bundle), `countup.js` (no React hooks).

---

## 4. Animated Product Demo in Hero

**Pattern:** Scroll-linked parallax layers using Framer Motion `useScroll` + `useTransform`

**Approach:**
- 3–4 PNG/WebP layers: device frame, UI screenshot, shadow, accent
- Each layer gets different scroll speed via `useTransform`
- `clipPath` reveal on scroll entry

```tsx
const { scrollY } = useScroll()
const y = useTransform(scrollY, [0, 500], [0, -80])
const opacity = useTransform(scrollY, [0, 300], [1, 0.6])

<motion.div style={{ y, opacity }}>
  <Image src="/hero-mockup.png" ... />
</motion.div>
```

**Asset guidelines:**
- Max 300KB per image, provide 2x variants
- Use `next/image` with `priority` prop on hero images
- Separate layers as distinct PNGs for parallax depth

---

## 5. Additional Enhancements

| Addition | Package | Version | Use case | Verdict |
|----------|---------|---------|----------|---------|
| Text splitting | `split-type` | 1.6.2 | Character/word stagger | Add only if needed |
| Scroll progress | — | — | Use Framer Motion `useScroll` | No new dep needed |
| SVG animation | — | — | Use Framer Motion SVG support | No new dep needed |

**Skip entirely:** AOS, React Spring, ScrollMagic, Waypoints, Three.js, react-countup.

---

## Bundle Impact

| Library | Size (gzipped) |
|---------|---------------|
| Framer Motion v12 (existing) | 32KB |
| Lenis | 15KB |
| use-count-up | 5KB |
| **Total new additions** | **~20KB** |

Total animation budget: ~52KB — acceptable for a premium landing page.

---

## Install Command

```bash
npm install lenis use-count-up
```
