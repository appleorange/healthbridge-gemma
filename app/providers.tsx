'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'

export function Providers({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Disable Lenis on touch devices (iOS momentum scroll conflict)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice && window.innerWidth < 768) return

    // Disable Next.js scroll restoration so Lenis owns it
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const lenis = new Lenis({ autoRaf: true })
    lenisRef.current = lenis

    return () => {
      lenis.destroy()
      lenisRef.current = null
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto'
      }
    }
  }, [])

  // Reset scroll position on route change
  useEffect(() => {
    window.scrollTo(0, 0)
    lenisRef.current?.scrollTo(0, { immediate: true })
  }, [pathname])

  return <>{children}</>
}
