'use client'
import Link from 'next/link'
import { Shield, ArrowRight } from 'lucide-react'

export function NavBar() {
  return (
    <nav className="sticky top-0 z-50 bg-[#f8f7f4]/90 backdrop-blur-sm border-b border-brand-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-brand-800 text-lg tracking-tight">HealthBridge</span>
      </div>
      <Link
        href="/onboarding"
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
      >
        Get started <ArrowRight className="w-4 h-4" />
      </Link>
    </nav>
  )
}
