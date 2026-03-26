'use client'
import Link from 'next/link'
import { Shield, FileText, GitBranch, Clock, ChevronRight } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Status-aware guidance',
    desc: 'Tailored to your visa, green card, or citizenship status — 14 different categories covered.',
  },
  {
    icon: GitBranch,
    title: 'Eligibility flowchart',
    desc: 'See exactly why you qualify or don\'t for each plan type, with the legal basis explained.',
  },
  {
    icon: FileText,
    title: 'Document parser',
    desc: 'Upload EOBs, insurance cards, prior auth letters — the AI extracts what matters.',
  },
  {
    icon: Clock,
    title: 'Enrollment timeline',
    desc: 'Never miss an open enrollment deadline, special enrollment period, or COBRA window.',
  },
]

const statuses = [
  'US Citizens', 'Green Card', 'H-1B / H-4', 'F-1 Students',
  'F-1 OPT', 'J-1 Scholars', 'DACA', 'Refugees & Asylees',
  'L-1 / O-1 / TN', 'Undocumented',
]

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">HealthBridge</span>
        </div>
        <Link href="/onboarding" className="btn-primary text-sm py-2 px-4">
          Get started
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <span>AI-powered health insurance navigator</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Health insurance shouldn&apos;t feel like a second job
        </h1>
        <p className="text-xl text-gray-500 mb-10 leading-relaxed">
          HealthBridge guides you through the US health insurance system based on your specific immigration status, income, and situation. Plain language. No jargon. Actionable.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/onboarding" className="btn-primary flex items-center gap-2">
            Find my coverage options
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Status badges */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <p className="text-center text-sm text-gray-400 mb-4">Covers all immigration statuses</p>
        <div className="flex flex-wrap justify-center gap-2">
          {statuses.map(s => (
            <span key={s} className="bg-white border border-gray-200 text-gray-600 text-sm px-3 py-1.5 rounded-full">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(f => (
            <div key={f.title} className="card p-6">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to find your coverage?</h2>
        <p className="text-brand-100 mb-8 text-lg">Takes about 3 minutes. No account required.</p>
        <Link href="/onboarding" className="bg-white text-brand-700 font-semibold px-8 py-4 rounded-xl hover:bg-brand-50 transition-all inline-flex items-center gap-2">
          Start now <ChevronRight className="w-4 h-4" />
        </Link>
      </section>
    </main>
  )
}
