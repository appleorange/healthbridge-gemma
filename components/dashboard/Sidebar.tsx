'use client'
import { memo, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Shield, Home, Compass, Wrench, HelpCircle, RotateCcw, Menu, X } from 'lucide-react'

const STALE_KEYS = ['hb_eligibility', 'hb_profile', 'hb_plan_cards', 'hb_plans_fetched', 'hb_compare_list', 'hb_chat_messages', 'hb_message_count', 'hb_doc_count', 'hb_appeal_count', 'hb_documents']

function clearAndRedirect(router: ReturnType<typeof useRouter>) {
  STALE_KEYS.forEach(k => sessionStorage.removeItem(k))
  router.push('/onboarding')
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { divider: true },
  { href: '/dashboard/explore', icon: Compass, label: 'Plans & Cost' },
  { divider: true },
  { href: '/dashboard/tools', icon: Wrench, label: 'Tools' },
  { divider: true },
  { href: '/dashboard/help', icon: HelpCircle, label: 'Help' },
] as const

type NavItem = { href: string; icon: React.ComponentType<{ className?: string }>; label: string } | { divider: true }

function NavContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="flex flex-col h-full py-5">
      {/* Logo */}
      <div className="px-4 mb-6 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-brand-800 text-base tracking-tight">HealthBridge</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5">
        {(NAV_ITEMS as readonly NavItem[]).map((item, i) => {
          if ('divider' in item) {
            return <div key={i} className="my-2 border-t border-gray-100" />
          }
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Start over */}
      <div className="px-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => router.push('/onboarding')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 w-full transition-all"
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          Start over
        </button>
      </div>
    </div>
  )
}

export const Sidebar = memo(function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('hb_eligibility')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed?.eligiblePlans)) {
        clearAndRedirect(router)
      }
    } catch {
      clearAndRedirect(router)
    }
  }, [router])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-100 bg-white h-[100dvh] sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile top header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
            <Shield className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-brand-800 text-sm">HealthBridge</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg hover:bg-gray-100"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-56 bg-white shadow-xl md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3.5 right-3 p-1.5 rounded-lg hover:bg-gray-100"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
              <NavContent onLinkClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
})
