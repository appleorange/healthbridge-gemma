'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, ArrowRight, CheckCircle } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

export function CTASection() {
  return (
    <>
      <section className="bg-brand-700 py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="max-w-xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Answer 5 questions.<br />Get your coverage plan.
          </h2>
          <p className="text-brand-300 mb-8 text-base">
            Free, private, and takes about 3 minutes.
            No account required.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-bold px-10 py-4 rounded-2xl text-base transition-colors"
          >
            Find my coverage options <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center justify-center gap-6 mt-8">
            {['Free to use', 'No data stored', 'All immigration statuses'].map(item => (
              <span key={item} className="flex items-center gap-1.5 text-xs text-brand-400">
                <CheckCircle className="w-3.5 h-3.5" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      <footer className="bg-brand-800 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
            <Shield className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-brand-300 text-sm">HealthBridge</span>
        </div>
        <p className="text-brand-500 text-xs">
          HealthBridge is an informational tool and does not constitute insurance advice.
          Always verify eligibility and plan details directly with your insurer or a certified navigator.
        </p>
      </footer>
    </>
  )
}
