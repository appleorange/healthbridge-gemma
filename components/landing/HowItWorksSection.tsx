'use client'
import { motion } from 'framer-motion'

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Tell us about yourself',
    description: 'Answer questions about your immigration status, employment, income, and health needs. Takes about 3 minutes.',
  },
  {
    step: '02',
    title: 'Get your personalized plan',
    description: 'The AI analyzes your situation and recommends the best coverage option with a clear explanation of why.',
  },
  {
    step: '03',
    title: 'Enroll with confidence',
    description: 'Compare real plans near you, check your doctors are covered, and enroll before your deadline.',
  },
]

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
}

const EASE = [0.22, 1, 0.36, 1] as const

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

export function HowItWorksSection() {
  return (
    <section className="bg-brand-700 py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-3">How it works</h2>
          <p className="text-brand-300 text-base">Answer 3 question types. Get a personalized coverage plan.</p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {HOW_IT_WORKS.map(step => (
            <motion.div key={step.step} variants={item} className="text-center">
              <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-white font-bold text-sm">{step.step}</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-brand-300 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
