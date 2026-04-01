'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scale, Stethoscope, HelpCircle, ExternalLink } from 'lucide-react'
import AppealAssistant from '@/components/appeals/AppealAssistant'
import GlossarySearch from '@/components/help/GlossarySearch'
import type { UserProfile, EligibilityResult } from '@/types'

const RESOURCES = [
  {
    label: 'Find a certified insurance navigator',
    description: 'Free, unbiased help enrolling in ACA or Medicaid coverage from a trained navigator in your area.',
    url: 'https://localhelp.healthcare.gov/',
    tag: 'Healthcare.gov',
  },
  {
    label: 'Healthcare.gov plan comparison tool',
    description: 'Compare real ACA marketplace plans by premium, deductible, and covered benefits.',
    url: 'https://healthcare.gov',
    tag: 'Federal marketplace',
  },
  {
    label: 'Medicaid eligibility & enrollment',
    description: "Apply for Medicaid directly through your state's portal or Medicaid.gov.",
    url: 'https://www.medicaid.gov/about-us/contact-us/contact-your-state-medicaid-office/index.html',
    tag: 'Medicaid.gov',
  },
  {
    label: 'Find a community health center',
    description: 'Federally Qualified Health Centers provide sliding-scale care regardless of insurance status.',
    url: 'https://findahealthcenter.hrsa.gov/',
    tag: 'HRSA.gov',
  },
]

export default function HelpPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null)

  useEffect(() => {
    const p = sessionStorage.getItem('hb_profile')
    const e = sessionStorage.getItem('hb_eligibility')
    if (!p || !e) { router.push('/onboarding'); return }
    setProfile(JSON.parse(p))
    setEligibility(JSON.parse(e))
  }, [router])

  if (!profile || !eligibility) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">

      {/* Appeal Assistant */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Appeal Assistant</h2>
        </div>
        <AppealAssistant userProfile={profile} eligibilityResult={eligibility} />
      </section>

      {/* Navigator / Resources */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Find a Navigator or Broker</h2>
        </div>
        <div className="space-y-2">
          {RESOURCES.map(resource => (
            <a
              key={resource.label}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-brand-200 hover:bg-brand-50/30 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-800">{resource.label}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{resource.tag}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{resource.description}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-brand-400 mt-0.5" />
            </a>
          ))}
        </div>
      </section>

      {/* Glossary */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Glossary</h2>
        </div>
        <GlossarySearch />
      </section>

    </div>
  )
}
