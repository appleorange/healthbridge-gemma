'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

const FAQS = [
  {
    q: 'Is my information stored or shared?',
    a: "No. Your profile is stored only in your browser session and is never sent to a database or shared with any third party. When you close the tab it's gone.",
  },
  {
    q: 'Is HealthBridge free to use?',
    a: "Yes, completely free. We don't sell insurance, take commissions, or have relationships with any insurance company.",
  },
  {
    q: 'Does this replace a real insurance broker or navigator?',
    a: "It complements them. HealthBridge gives you the knowledge to understand your options and ask the right questions. For complex situations, we'll point you to free certified navigators in your area.",
  },
  {
    q: "What if my immigration status isn't listed?",
    a: 'Select "Other" and the AI will ask clarifying questions to determine your eligibility. We cover 14 standard categories plus edge cases.',
  },
  {
    q: 'Can I use this if I already have insurance?',
    a: "Yes — many people use HealthBridge to check if their current plan is still the best option at renewal, or to understand a denial letter.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-brand-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-brand-50 transition-colors"
      >
        <span className="text-sm font-semibold text-brand-800">{q}</span>
        <ChevronRight className={`w-4 h-4 text-brand-400 transition-transform flex-shrink-0 ml-3 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 bg-brand-50 border-t border-brand-100">
          <p className="text-sm text-brand-700 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export function FAQSection() {
  return (
    <section className="py-24 px-6 bg-[#f8f7f4]">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-brand-800 mb-3">Common questions</h2>
          <p className="text-gray-500 text-base">Everything you want to know before getting started.</p>
        </motion.div>
        <div className="space-y-3">
          {FAQS.map(faq => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  )
}
