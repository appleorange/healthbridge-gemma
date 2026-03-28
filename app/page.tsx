'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, GitBranch, FileText, Clock, ChevronRight, CheckCircle, ArrowRight, Scale, Search } from 'lucide-react'
import Marquee from '@/components/ui/Marquee'
import GradientText from '@/components/ui/GradientText'
import SpotlightCard from '@/components/ui/SpotlightCard'

const ROW_ONE = [
  'US Citizens', 'Green Card (LPR)', 'H-1B / H-4', 'F-1 Students',
  'F-1 OPT', 'J-1 Scholars', 'J-2 Dependents', 'L-1 Visa',
]
const ROW_TWO = [
  'DACA Recipients', 'Refugees & Asylees', 'O-1 / TN Visa',
  'Undocumented', 'H-4 Dependents', 'Retired', 'Self-employed',
]

const FEATURES = [
  {
    icon: Shield,
    title: 'Status-aware guidance',
    description: 'Tailored to your visa, green card, or citizenship status. 14 immigration categories covered with specific eligibility rules for each.',
  },
  {
    icon: GitBranch,
    title: 'Eligibility flowchart',
    description: 'See exactly why you qualify or don\'t for each plan type, with the legal basis explained in plain language.',
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
    description: 'Got a claim denied? We\'ll draft a personalized appeal letter and track your deadlines.',
  },
]

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

const FAQS = [
  {
    q: 'Is my information stored or shared?',
    a: 'No. Your profile is stored only in your browser session and is never sent to a database or shared with any third party. When you close the tab it\'s gone.',
  },
  {
    q: 'Is HealthBridge free to use?',
    a: 'Yes, completely free. We don\'t sell insurance, take commissions, or have relationships with any insurance company.',
  },
  {
    q: 'Does this replace a real insurance broker or navigator?',
    a: 'It complements them. HealthBridge gives you the knowledge to understand your options and ask the right questions. For complex situations, we\'ll point you to free certified navigators in your area.',
  },
  {
    q: 'What if my immigration status isn\'t listed?',
    a: 'Select "Other" and the AI will ask clarifying questions to determine your eligibility. We cover 14 standard categories plus edge cases.',
  },
  {
    q: 'Can I use this if I already have insurance?',
    a: 'Yes — many people use HealthBridge to check if their current plan is still the best option at renewal, or to understand a denial letter.',
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

export default function HomePage() {
  return (
    <div className="min-h-screen text-gray-900" style={{ background: '#eeeee8' }}>

      {/* ── Nav ── */}
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

      {/* ── Hero ── */}
      <section className="relative w-full px-6 pt-20 pb-16 text-center">
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            AI-powered health insurance navigator
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-6xl font-bold text-brand-800 leading-tight tracking-tight mb-6"
        >
          Health insurance<br />
          <GradientText from="#588157" to="#a3b18a">shouldn&apos;t feel like</GradientText><br />
          a second job.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto"
        >
          HealthBridge guides you through the US health insurance system based on
          your specific immigration status, income, and situation.
          Plain language. No jargon. Actionable.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 mb-16"
        >
          {['Based on ACA federal guidelines', 'Updated for 2026', 'Covers all 50 states', 'Free to use'].map(item => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-brand-400" />
              {item}
            </span>
          ))}
        </motion.div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <section className="pb-20 overflow-hidden w-full" style={{ background: '#eeeee8' }}>
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
          Covers all immigration statuses
        </p>
        <div className="space-y-3">
          <Marquee speed={35} pauseOnHover>
            {ROW_ONE.map(label => (
              <span
                key={label}
                className="flex-shrink-0 px-5 py-2.5 bg-white border border-brand-200 rounded-full text-sm font-medium text-brand-700 mx-1.5 whitespace-nowrap"
              >
                {label}
              </span>
            ))}
          </Marquee>
          <Marquee speed={28} reverse pauseOnHover>
            {ROW_TWO.map(label => (
              <span
                key={label}
                className="flex-shrink-0 px-5 py-2.5 bg-brand-100 border border-brand-200 rounded-full text-sm font-medium text-brand-700 mx-1.5 whitespace-nowrap"
              >
                {label}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-brand-700 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-3">How it works</h2>
            <p className="text-brand-300 text-base">Answer 3 questions types. Get a personalized coverage plan.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <span className="text-white font-bold text-sm">{step.step}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-brand-300 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 bg-[#f8f7f4]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-brand-800 mb-3">Everything you need</h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Not just a plan finder — a full navigator that works with you from first question to enrolled.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <SpotlightCard className="bg-white border border-brand-100 rounded-2xl p-6 hover:border-brand-300 hover:shadow-sm transition-all group h-full">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors">
                    <f.icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <h3 className="font-bold text-brand-800 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className="py-24 px-6 bg-brand-100">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-brand-800 mb-3">Without vs with HealthBridge</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white border border-red-100 rounded-2xl p-6"
            >
              <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-4">Without HealthBridge</p>
              <ul className="space-y-3">
                {[
                  'Googling "health insurance for F-1 visa" for 2 hours',
                  'Getting quoted plans you don\'t qualify for',
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
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-brand-700 border border-brand-600 rounded-2xl p-6"
            >
              <p className="text-xs font-bold text-brand-300 uppercase tracking-wide mb-4">With HealthBridge</p>
              <ul className="space-y-3">
                {[
                  'One recommendation in 3 minutes, tailored to your status',
                  'Only see plans you actually qualify for',
                  'CMU fall enrollment deadline on your timeline automatically',
                  'Cost estimate shows you\'ll spend $1,260/year on your plan',
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

      {/* ── FAQ ── */}
      <section className="py-24 px-6 bg-[#f8f7f4]">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
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

      {/* ── Final CTA ── */}
      <section className="bg-brand-700 py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
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

      {/* ── Footer ── */}
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
    </div>
  )
}
