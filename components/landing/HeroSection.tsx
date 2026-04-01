'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ArrowRight, CheckCircle, ChevronDown } from 'lucide-react'
import { useCountUp } from 'use-count-up'
import GradientText from '@/components/ui/GradientText'

const EASE = [0.22, 1, 0.36, 1] as const

// ── Product demo screens ──────────────────────────────────────────────────────

function OnboardingScreen() {
  return (
    <div className="p-5">
      <div className="flex items-center gap-1.5 mb-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 2 ? 'bg-brand-500' : 'bg-brand-100'}`} />
        ))}
      </div>
      <p className="text-[10px] font-semibold text-brand-500 uppercase tracking-wide mb-1">Step 2 of 5</p>
      <h3 className="text-sm font-bold text-brand-800 mb-4 leading-snug">
        What is your current immigration status?
      </h3>
      <div className="space-y-2 mb-4">
        {['H-1B Visa (Specialty Occupation)', 'F-1 Student Visa', 'Green Card (LPR)', 'J-1 Cultural Exchange'].map((opt, i) => (
          <div
            key={opt}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              i === 0
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-white border-brand-200 text-brand-700'
            }`}
          >
            {opt}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-2 rounded-lg border border-brand-200 text-xs text-brand-600 font-medium">← Back</button>
        <button className="flex-1 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold">Continue →</button>
      </div>
    </div>
  )
}

function RecommendationScreen() {
  return (
    <div className="p-5">
      <p className="text-[10px] font-semibold text-brand-500 uppercase tracking-wide mb-3">Your recommendation</p>
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 mb-3">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-brand-800">ACA Marketplace Plan</p>
            <p className="text-[10px] text-brand-600 mt-0.5">Best match for H-1B holders in CA</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white rounded-lg border border-brand-100 p-2.5">
          <p className="text-[10px] text-gray-400 mb-0.5">Est. premium</p>
          <p className="text-sm font-bold text-brand-800">$89<span className="text-[10px] font-normal text-gray-400">/mo</span></p>
          <p className="text-[9px] text-brand-500">After $340 subsidy</p>
        </div>
        <div className="bg-white rounded-lg border border-brand-100 p-2.5">
          <p className="text-[10px] text-gray-400 mb-0.5">Fit score</p>
          <p className="text-sm font-bold text-brand-800">94<span className="text-[10px] font-normal text-gray-400">%</span></p>
          <p className="text-[9px] text-brand-500">Excellent match</p>
        </div>
      </div>
      <button className="w-full py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold">
        View matching plans →
      </button>
    </div>
  )
}

function PlanCardScreen() {
  return (
    <div className="p-5">
      <p className="text-[10px] font-semibold text-brand-500 uppercase tracking-wide mb-3">Top match</p>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-bold text-brand-800">Blue Shield Silver PPO</p>
          <span className="text-[10px] bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">92% fit</span>
        </div>
        <p className="text-[10px] text-gray-400">Covered California · Plan ID: SL-0842</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {[
          ['Monthly', '$89/mo', 'after subsidy'],
          ['Deductible', '$1,500', 'per year'],
          ['Out-of-pocket', '$4,000', 'maximum'],
          ['Network', 'PPO', 'any doctor'],
        ].map(([label, val, sub]) => (
          <div key={label} className="bg-brand-50 rounded-lg p-2">
            <p className="text-[9px] text-gray-400 mb-0.5">{label}</p>
            <p className="text-xs font-bold text-brand-800">{val}</p>
            <p className="text-[9px] text-brand-500">{sub}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1 mb-3">
        {['Your doctors are in-network', 'Prescriptions covered'].map(item => (
          <div key={item} className="flex items-center gap-1.5 text-[10px] text-brand-700">
            <CheckCircle className="w-3 h-3 text-brand-500 flex-shrink-0" />
            {item}
          </div>
        ))}
      </div>
      <button className="w-full py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold">
        Compare all plans
      </button>
    </div>
  )
}

const SCREENS = [
  { id: 'onboarding', label: 'Questionnaire', component: OnboardingScreen },
  { id: 'recommendation', label: 'Recommendation', component: RecommendationScreen },
  { id: 'plan', label: 'Plan details', component: PlanCardScreen },
]

function ProductDemo() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex(i => (i + 1) % SCREENS.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const ActiveScreen = SCREENS[activeIndex].component

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
      className="w-full max-w-sm mx-auto mt-12"
    >
      {/* Browser chrome */}
      <div className="bg-[#e8e8e8] rounded-t-2xl px-4 py-2.5 flex items-center gap-2 border border-b-0 border-brand-200">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-gray-400 text-center border border-gray-200">
          healthbridge.app
        </div>
      </div>

      {/* Screen area */}
      <div className="bg-white border border-brand-200 rounded-b-2xl shadow-lg overflow-hidden min-h-[260px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <ActiveScreen />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Screen indicators */}
      <div className="flex items-center justify-center gap-3 mt-3">
        {SCREENS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveIndex(i)}
            className={`text-[10px] font-medium transition-colors ${
              i === activeIndex ? 'text-brand-600' : 'text-gray-400 hover:text-brand-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

// ── Animated stat counter ─────────────────────────────────────────────────────

function StatCounter({
  end,
  suffix = '',
  prefix = '',
  label,
  isCounting,
}: {
  end: number
  suffix?: string
  prefix?: string
  label: string
  isCounting: boolean
}) {
  const { value } = useCountUp({
    isCounting,
    end,
    duration: 2,
    easing: 'easeOutCubic',
  })
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-brand-800 tabular-nums">
        {prefix}{isCounting ? value : 0}{suffix}
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

// ── Hero section ──────────────────────────────────────────────────────────────

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const [counting, setCounting] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <section className="relative w-full px-6 pt-20 pb-8 text-center">
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 20%, #a3b18a77 0%, transparent 60%),
            radial-gradient(ellipse 70% 50% at 80% 10%, #58815744 0%, transparent 55%),
            radial-gradient(ellipse 60% 70% at 50% 80%, #a3b18a44 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 90% 60%, #3a5a4033 0%, transparent 50%),
            radial-gradient(ellipse 100% 30% at 50% 100%, #a3b18a22 0%, transparent 70%),
            #eeeee8
          `,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">
        <motion.div
          initial={mounted ? { opacity: 0, y: 10 } : {}}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            AI-powered health insurance navigator
          </span>
        </motion.div>

        <motion.h1
          initial={mounted ? { opacity: 0, y: 16 } : {}}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-6xl font-bold text-brand-800 leading-tight tracking-tight mb-6"
        >
          Health insurance<br />
          <GradientText from="#588157" to="#a3b18a">shouldn&apos;t feel like</GradientText><br />
          a second job.
        </motion.h1>

        <motion.p
          initial={mounted ? { opacity: 0, y: 12 } : {}}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto"
        >
          HealthBridge guides you through the US health insurance system based on
          your specific immigration status, income, and situation.
          Plain language. No jargon. Actionable.
        </motion.p>

        <motion.div
          initial={mounted ? { opacity: 0, y: 10 } : {}}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
        >
          <Link
            href="/onboarding"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors shadow-sm"
          >
            Find my coverage options <ArrowRight className="w-5 h-5" />
          </Link>
          <span className="text-sm text-gray-400">Free · No account required · 3 minutes</span>
        </motion.div>

        {/* Animated stats */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 16 } : {}}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          onViewportEnter={() => setCounting(true)}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-lg mx-auto mb-10 py-6 border-y border-brand-200"
        >
          <StatCounter end={14} suffix="+" label="Immigration categories" isCounting={counting} />
          <StatCounter end={3} suffix=" min" label="Average time to plan" isCounting={counting} />
          <StatCounter end={50} label="States covered" isCounting={counting} />
          <StatCounter end={100} suffix="%" label="Free to use" isCounting={counting} />
        </motion.div>

        {/* Product demo */}
        <ProductDemo />

        {/* Scroll hint */}
        <motion.div
          initial={mounted ? { opacity: 0 } : {}}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="flex flex-col items-center gap-1 mt-10 text-brand-400"
        >
          <span className="text-xs">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
