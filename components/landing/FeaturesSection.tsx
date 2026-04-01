'use client'
import { motion } from 'framer-motion'
import { Shield, GitBranch, FileText, Clock, Search, Scale } from 'lucide-react'
import SpotlightCard from '@/components/ui/SpotlightCard'

const FEATURES = [
  {
    icon: Shield,
    title: 'Status-aware guidance',
    description: 'Tailored to your visa, green card, or citizenship status. 14 immigration categories covered with specific eligibility rules for each.',
  },
  {
    icon: GitBranch,
    title: 'Eligibility flowchart',
    description: "See exactly why you qualify or don't for each plan type, with the legal basis explained in plain language.",
  },
  {
    icon: FileText,
    title: 'Document parser',
    description: 'Upload EOBs, insurance cards, or prior auth letters. The AI extracts what matters and flags deadlines.',
  },
  {
    icon: Clock,
    title: 'Enrollment timeline',
    description: 'Never miss an open enrollment deadline, special enrollment period, or COBRA window.',
  },
  {
    icon: Search,
    title: 'Plans near you',
    description: 'Real ACA marketplace plans by ZIP code, ranked by how well they match your profile and benefit priorities.',
  },
  {
    icon: Scale,
    title: 'Appeal assistant',
    description: "Got a claim denied? We'll draft a personalized appeal letter and track your deadlines.",
  },
]

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09 },
  },
}

const EASE = [0.22, 1, 0.36, 1] as const

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

export function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-[#f8f7f4]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-brand-800 mb-3">Everything you need</h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Not just a plan finder — a full navigator that works with you from first question to enrolled.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-5"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {FEATURES.map(f => (
            <motion.div key={f.title} variants={item}>
              <SpotlightCard className="bg-white border border-brand-100 rounded-2xl p-6 hover:border-brand-300 hover:shadow-sm transition-all group h-full">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors">
                  <f.icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-bold text-brand-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
