'use client'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

export function BeforeAfterSection() {
  return (
    <section className="py-24 px-6 bg-brand-100">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-brand-800 mb-3">Without vs with HealthBridge</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="bg-white border border-red-100 rounded-2xl p-6"
          >
            <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-4">Without HealthBridge</p>
            <ul className="space-y-3">
              {[
                'Googling "health insurance for F-1 visa" for 2 hours',
                "Getting quoted plans you don't qualify for",
                'Missing the SHIP waiver deadline because no one told you',
                'Picking the cheapest plan and getting a $4,000 ER bill',
                'Not knowing you could appeal a denied claim',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                  <span className="text-red-300 mt-0.5 flex-shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            className="bg-brand-700 border border-brand-600 rounded-2xl p-6"
          >
            <p className="text-xs font-bold text-brand-300 uppercase tracking-wide mb-4">With HealthBridge</p>
            <ul className="space-y-3">
              {[
                'One recommendation in 3 minutes, tailored to your status',
                'Only see plans you actually qualify for',
                'CMU fall enrollment deadline on your timeline automatically',
                "Cost estimate shows you'll spend $1,260/year on your plan",
                'Appeal assistant drafts your letter and tracks your deadline',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-brand-200">
                  <CheckCircle className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
