'use client'
import { useState, useEffect } from 'react'
import { NavBar } from '@/components/landing/NavBar'
import { HeroSection } from '@/components/landing/HeroSection'
import { MarqueeSection } from '@/components/landing/MarqueeSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { BeforeAfterSection } from '@/components/landing/BeforeAfterSection'
import { FAQSection } from '@/components/landing/FAQSection'
import { CTASection } from '@/components/landing/CTASection'

export default function HomePage() {
  const [mousePos, setMousePos] = useState({ x: -9999, y: -9999 })

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen text-gray-900 relative" style={{ background: '#eeeee8' }}>
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(200px circle at ${mousePos.x}px ${mousePos.y}px, rgba(88, 129, 87, 0.12) 0%, transparent 80%)`,
          transition: 'none',
        }}
      />
      <NavBar />
      <HeroSection />
      <MarqueeSection />
      <HowItWorksSection />
      <FeaturesSection />
      <BeforeAfterSection />
      <FAQSection />
      <CTASection />
    </div>
  )
}
