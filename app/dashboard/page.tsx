'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield, GitBranch, MessageCircle, CheckCircle, AlertCircle, Clock,
  ChevronRight, RotateCcw, Calendar, FileText, DollarSign, MapPin,
  Sparkles, Stethoscope, HelpCircle, Compass, Wrench, ChevronDown, ChevronUp,
  ExternalLink, Scale,
} from 'lucide-react'
import EligibilityFlowchart from '@/components/flowchart/EligibilityFlowchart'
import ChatInterface from '@/components/chat/ChatInterface'
import EnrollmentTimeline from '@/components/timeline/EnrollmentTimeline'
import DocumentHub from '@/components/documents/DocumentHub'
import CostEstimator from '@/components/calculators/CostEstimator'
import PlanCards from '@/components/plans/PlanCards'
import PlanComparison from '@/components/plans/PlanComparison'
import NetworkChecker from '@/components/network/NetworkChecker'
import AppealAssistant from '@/components/appeals/AppealAssistant'
import GlossarySearch from '@/components/help/GlossarySearch'
import type { UserProfile, EligibilityResult, PlanType, PlanCard, ParsedDocument } from '@/types'

const PLAN_INFO: Record<PlanType, { label: string; color: string; description: string; detail: string }> = {
  medicaid: {
    label: 'Medicaid',
    color: 'brand',
    description: 'Free or very low-cost government coverage based on income.',
    detail: 'Medicaid is a joint federal-state program that provides comprehensive health coverage at little or no cost. It covers doctor visits, hospital stays, prescriptions, mental health, and preventive care. There are no premiums in most states and minimal copays.',
  },
  chip: {
    label: 'CHIP',
    color: 'brand',
    description: 'Low-cost coverage for children in families that earn too much for Medicaid.',
    detail: 'The Children\'s Health Insurance Program covers kids up to age 19 in families who earn too much for Medicaid but can\'t afford private insurance. Premiums and copays are low, and coverage is comprehensive.',
  },
  aca_marketplace: {
    label: 'ACA Marketplace',
    color: 'blue',
    description: 'Subsidized private plans on Healthcare.gov or your state exchange.',
    detail: 'The ACA marketplace offers private health plans that must cover essential health benefits. Plans are categorized as Bronze, Silver, Gold, or Platinum — higher metal tiers mean lower out-of-pocket costs but higher premiums. If your income is 100–400% of the federal poverty level, you may qualify for a Premium Tax Credit to reduce your monthly cost.',
  },
  employer_sponsored: {
    label: 'Employer-sponsored plan',
    color: 'blue',
    description: 'Health coverage through your employer, usually the most cost-effective option.',
    detail: 'Employer-sponsored insurance is provided through your job. Your employer typically pays 50–80% of the premium, making it far cheaper than buying coverage on your own. You\'re generally limited to your employer\'s chosen plans, but most include comprehensive coverage.',
  },
  school_plan: {
    label: 'University health plan (SHIP)',
    color: 'purple',
    description: 'Student Health Insurance Plan offered directly by your university.',
    detail: 'Most US universities offer a Student Health Insurance Plan (SHIP). These are ACA-compliant plans tailored to students — they cover campus health centers and nearby providers. Many schools require proof of insurance and allow you to waive the SHIP if you have comparable coverage elsewhere.',
  },
  international_student_plan: {
    label: 'International student plan (ISP)',
    color: 'purple',
    description: 'Private plans designed specifically for international students.',
    detail: 'International Student Plans are private health insurance plans marketed to students on F-1, J-1, and similar visas. They\'re often cheaper than university SHIPs but may have narrower networks and lower coverage limits. Always verify an ISP meets your school\'s waiver requirements before choosing it over the SHIP.',
  },
  short_term: {
    label: 'Short-term health plan',
    color: 'amber',
    description: 'Temporary coverage with limited benefits. Use only as a last resort.',
    detail: 'Short-term plans fill gaps in coverage for a few months but are not ACA-compliant. They typically exclude pre-existing conditions, mental health, maternity, and preventive care. Premiums are low, but you can face massive out-of-pocket costs if you need serious care. Use only as a bridge — not as a long-term strategy.',
  },
  cobra: {
    label: 'COBRA continuation',
    color: 'amber',
    description: 'Keep your former employer\'s coverage for up to 18 months after leaving a job.',
    detail: 'COBRA lets you continue your employer\'s exact health plan after a job loss, reduced hours, or other qualifying events. Coverage is identical to what you had, including your same doctors and network. The catch: you pay the full premium (what you paid plus what your employer paid) plus a 2% admin fee — which can be expensive. You have 60 days to elect COBRA.',
  },
  medicare: {
    label: 'Medicare',
    color: 'brand',
    description: 'Federal insurance for people 65+ or with qualifying disabilities.',
    detail: 'Medicare is the federal health insurance program for people 65 and older, and for younger people with certain disabilities or End-Stage Renal Disease. It has multiple parts: Part A (hospital), Part B (medical), Part C (Medicare Advantage), and Part D (prescription drugs).',
  },
  va: {
    label: 'VA Healthcare',
    color: 'blue',
    description: 'Healthcare through the Department of Veterans Affairs.',
    detail: 'VA Healthcare provides medical care to eligible veterans through a network of VA medical centers and clinics. Eligibility depends on service history, disability rating, and income. Veterans with service-connected conditions receive priority access.',
  },
  parent_plan: {
    label: "Parent or spouse's plan",
    color: 'blue',
    description: 'Staying on your current dependent coverage — the best option for your situation.',
    detail: 'Based on your plan details and profile, remaining on your current dependent coverage is your best option. This is typically the case when the plan is comprehensive, low-cost to you, and you have significant time before aging off. Review this annually and start planning your transition at least 6 months before you turn 26 or lose eligibility.',
  },
  none: {
    label: 'No standard options',
    color: 'red',
    description: 'No standard plans available — but community resources may still help.',
    detail: 'Based on your profile, you don\'t qualify for standard health insurance programs. Community Health Centers (Federally Qualified Health Centers) offer sliding-scale care regardless of immigration status. Emergency Medicaid covers emergency stabilization in most states. Ask your AI navigator for specific resources in your area.',
  },
}

type Tab = 'recommendation' | 'explore' | 'tools' | 'help'
type ToolsSubTab = 'chat' | 'documents'

const TABS = [
  { id: 'recommendation' as Tab, icon: CheckCircle,  label: 'My Recommendation' },
  { id: 'explore'        as Tab, icon: Compass,       label: 'Explore' },
  { id: 'tools'          as Tab, icon: Wrench,         label: 'Tools' },
  { id: 'help'           as Tab, icon: HelpCircle,    label: 'Help' },
] as const

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null)
  const [tab, setTab] = useState<Tab>('recommendation')
  const [toolsSubTab, setToolsSubTab] = useState<ToolsSubTab>('chat')
  const [exploreSubTab, setExploreSubTab] = useState<'plans' | 'costs' | 'network'>('plans')
  const [expandedPlan, setExpandedPlan] = useState<PlanType | null>(null)
  const [showFlowchart, setShowFlowchart] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [planCards, setPlanCards] = useState<PlanCard[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [plansFetched, setPlansFetched] = useState(false)
  const [chatAutoPrompt, setChatAutoPrompt] = useState<string | undefined>(undefined)
  const [compareList, setCompareList] = useState<string[]>([])
  const [documents, setDocuments] = useState<ParsedDocument[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(sessionStorage.getItem('hb_documents') ?? '[]') } catch { return [] }
  })

  useEffect(() => {
    const p = sessionStorage.getItem('hb_profile')
    const e = sessionStorage.getItem('hb_eligibility')
    if (!p || !e) { router.push('/onboarding'); return }
    setProfile(JSON.parse(p))
    setEligibility(JSON.parse(e))
  }, [router])

  useEffect(() => {
    sessionStorage.setItem('hb_documents', JSON.stringify(documents))
  }, [documents])

  if (!profile || !eligibility) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const primary = PLAN_INFO[eligibility.primaryRecommendation]

  async function fetchPlans() {
    if (plansFetched || !profile || !eligibility) return
    setPlansLoading(true)
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          eligiblePlans: eligibility.eligiblePlans,
          primaryRecommendation: eligibility.primaryRecommendation,
        }),
      })
      const data = await res.json()
      setPlanCards(data.plans ?? [])
      setPlansFetched(true)
    } catch {
      setPlansFetched(true)
    } finally {
      setPlansLoading(false)
    }
  }

  function handleTabChange(newTab: Tab) {
    setTab(newTab)
    if (newTab === 'explore') fetchPlans()
  }

  function handleDenialDetected(denial: { planName: string; denialReason: string; denialDate: string; serviceDescription: string }) {
    try { sessionStorage.setItem('hb_pending_denial', JSON.stringify(denial)) } catch {}
    setTab('help')
  }

  function toggleCompare(planId: string) {
    setCompareList(prev => {
      if (prev.includes(planId)) return prev.filter(id => id !== planId)
      if (prev.length >= 3) return prev
      return [...prev, planId]
    })
  }

  const compareCards = planCards.filter(p => compareList.includes(p.id))
  const docDeadlines = documents.flatMap(d => d.deadlines.map(dl => ({ ...dl, fileName: d.fileName })))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-gray-900">HealthBridge</span>
        </div>
        <button
          onClick={() => router.push('/onboarding')}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Start over
        </button>
      </div>

      {/* Primary recommendation banner */}
      <div className="bg-brand-600 text-white px-6 py-5">
        <p className="text-brand-200 text-xs font-medium uppercase tracking-wide mb-1">Best option for your situation</p>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-bold">{primary.label}</h2>
          {eligibility.costEstimates && (() => {
            const est = eligibility.costEstimates!.find(e => e.planType === eligibility.primaryRecommendation)
            if (!est) return null
            return (
              <span className="text-xs bg-brand-500 text-white border border-brand-400 px-2.5 py-1 rounded-full font-medium">
                Est. {est.estimatedMonthlyPremium.low === est.estimatedMonthlyPremium.high ? `$${est.estimatedMonthlyPremium.low}` : `$${est.estimatedMonthlyPremium.low}–$${est.estimatedMonthlyPremium.high}`}/mo
              </span>
            )
          })()}
        </div>
        {eligibility.bestOptionReasoning && (
          <p className="text-brand-100 text-sm mt-2 leading-relaxed max-w-xl">
            {eligibility.bestOptionReasoning}
          </p>
        )}
        {/* CTA row */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={() => handleTabChange('explore')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-all border border-white/20"
          >
            <MapPin className="w-3.5 h-3.5" /> Explore plans
          </button>
          <button
            onClick={() => { setTab('tools'); setToolsSubTab('chat') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-all border border-white/20"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Ask AI
          </button>
          <button
            onClick={() => { setTab('tools'); setToolsSubTab('documents') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-all border border-white/20"
          >
            <FileText className="w-3.5 h-3.5" /> Upload docs
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-2">
        <div className="flex gap-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className={`flex-1 ${tab === 'tools' && toolsSubTab === 'chat' ? 'flex flex-col' : ''}`}>

        {/* ─── RECOMMENDATION TAB ─────────────────────────────────── */}
        {tab === 'recommendation' && (
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-6 w-full">

            {/* Eligible plans */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Plans you qualify for ({eligibility.eligiblePlans.length})
              </h3>
              <div className="space-y-2">
                {eligibility.eligiblePlans.map(plan => {
                  const info = PLAN_INFO[plan]
                  const isPrimary = plan === eligibility.primaryRecommendation
                  const isExpanded = expandedPlan === plan
                  const est = eligibility.costEstimates?.find(e => e.planType === plan)

                  return (
                    <div
                      key={plan}
                      className={`rounded-xl border overflow-hidden transition-all ${
                        isPrimary ? 'bg-brand-50 border-brand-300' : 'bg-white border-gray-100'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedPlan(isExpanded ? null : plan)}
                        className="w-full flex items-start gap-3 p-4 text-left"
                      >
                        <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isPrimary ? 'text-brand-500' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-semibold ${isPrimary ? 'text-brand-800' : 'text-gray-800'}`}>
                              {info.label}
                            </p>
                            {isPrimary && (
                              <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Recommended
                              </span>
                            )}
                            {est && (
                              <span className="text-xs text-gray-400">
                                ~{est.estimatedMonthlyPremium.low === est.estimatedMonthlyPremium.high ? `$${est.estimatedMonthlyPremium.low}` : `$${est.estimatedMonthlyPremium.low}–$${est.estimatedMonthlyPremium.high}`}/mo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{info.description}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform mt-0.5 ${isExpanded ? 'rotate-90' : ''} ${isPrimary ? 'text-brand-400' : 'text-gray-300'}`} />
                      </button>

                      {isExpanded && (
                        <div className={`px-4 pb-4 pt-0 border-t ${isPrimary ? 'border-brand-200' : 'border-gray-100'}`}>
                          <p className={`text-sm leading-relaxed mt-3 ${isPrimary ? 'text-brand-700' : 'text-gray-600'}`}>
                            {info.detail}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Special circumstances */}
            {eligibility.specialCircumstances.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Important notes</h3>
                <div className="space-y-2">
                  {eligibility.specialCircumstances.map((note, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">{note}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Next steps */}
            {eligibility.nextSteps.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Next steps</h3>
                <div className="space-y-2">
                  {eligibility.nextSteps.map(step => (
                    <div key={step.id} className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        step.priority === 'high' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <Clock className={`w-3 h-3 ${step.priority === 'high' ? 'text-red-500' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                        {step.deadline && (
                          <p className="text-xs text-red-500 mt-1 font-medium">Deadline: {step.deadline}</p>
                        )}
                      </div>
                      {step.actionUrl && (
                        <a
                          href={step.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:text-brand-700"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* From your documents */}
            {documents.length > 0 && (() => {
              const allDeadlines = documents.flatMap(d => d.deadlines.map(dl => ({ ...dl, fileName: d.fileName })))
              const allFlagged = documents.flatMap(d => d.extractedFields.filter(f => f.flagged).map(f => ({ ...f, fileName: d.fileName })))
              if (allDeadlines.length === 0 && allFlagged.length === 0) return null
              return (
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    From your documents ({documents.length})
                  </h3>
                  <div className="space-y-2">
                    {allDeadlines.map((dl, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${dl.urgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="flex items-start gap-2 min-w-0">
                          <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dl.urgent ? 'text-red-500' : 'text-amber-500'}`} />
                          <div className="min-w-0">
                            <p className={`text-sm font-medium ${dl.urgent ? 'text-red-800' : 'text-amber-800'}`}>{dl.label}</p>
                            <p className="text-xs text-gray-400 truncate">{dl.fileName}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold whitespace-nowrap ml-2 ${dl.urgent ? 'text-red-600' : 'text-amber-600'}`}>{dl.date}</span>
                      </div>
                    ))}
                    {allFlagged.map((f, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 p-3 bg-white border border-amber-200 rounded-xl">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" /> {f.label}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{f.fileName}</p>
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-right whitespace-nowrap">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })()}

            {/* Eligibility flowchart (collapsible) */}
            <section>
              <button
                onClick={() => setShowFlowchart(s => !s)}
                className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">Why this route?</span>
                  <span className="text-xs text-gray-400">How your eligibility was determined</span>
                </div>
                {showFlowchart ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showFlowchart && (
                <div className="mt-2 p-4 bg-white border border-gray-100 rounded-xl">
                  <EligibilityFlowchart
                    nodes={eligibility.flowchartNodes}
                    edges={eligibility.flowchartEdges}
                    profile={profile}
                  />
                </div>
              )}
            </section>

            {/* Enrollment timeline (collapsible) */}
            <section>
              <button
                onClick={() => setShowTimeline(s => !s)}
                className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">Enrollment calendar</span>
                  <span className="text-xs text-gray-400">Key dates and deadlines</span>
                </div>
                {showTimeline ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showTimeline && (
                <div className="mt-2 p-4 bg-white border border-gray-100 rounded-xl">
                  <EnrollmentTimeline
                    profile={profile}
                    eligibilityResult={eligibility}
                    docDeadlines={docDeadlines}
                  />
                </div>
              )}
            </section>

            {/* Ineligible plans */}
            {eligibility.ineligiblePlans.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Plans you don&apos;t qualify for
                </h3>
                <div className="flex flex-wrap gap-2">
                  {eligibility.ineligiblePlans.map(plan => (
                    <span key={plan} className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full line-through">
                      {PLAN_INFO[plan].label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Expand &quot;Why this route?&quot; above to see the legal reasons behind each decision.
                </p>
              </section>
            )}
          </div>
        )}

        {/* ─── EXPLORE TAB ────────────────────────────────────────── */}
        {tab === 'explore' && (
          <>
            {/* Sub-tab bar */}
            <div className="bg-white border-b border-gray-100 px-4">
              <div className="flex gap-0 max-w-2xl mx-auto">
                {([
                  { id: 'plans' as const, label: 'Plans near me' },
                  { id: 'costs' as const, label: 'Cost breakdown' },
                  { id: 'network' as const, label: 'Network checker' },
                ]).map(st => (
                  <button
                    key={st.id}
                    onClick={() => setExploreSubTab(st.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                      exploreSubTab === st.id
                        ? 'border-brand-500 text-brand-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-8 w-full">

              {exploreSubTab === 'plans' && (
                <div className="space-y-6">
                  <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-sm text-brand-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-4 h-4 text-brand-500 flex-shrink-0" />
                      <span>AI recommends: <strong>{primary.label}</strong></span>
                    </div>
                    <button onClick={() => setTab('recommendation')} className="text-xs text-brand-600 font-medium whitespace-nowrap">Why? →</button>
                  </div>
                  {!profile.zipCode && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      No ZIP code on file — showing estimated plans. Add your ZIP in onboarding for real results.
                    </div>
                  )}
                  {compareList.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex items-center justify-between gap-2">
                      <span>{compareList.length} plan{compareList.length > 1 ? 's' : ''} selected for comparison</span>
                      <button onClick={() => setCompareList([])} className="text-xs text-blue-600 font-medium">Clear</button>
                    </div>
                  )}
                  <PlanCards
                    plans={planCards}
                    loading={plansLoading}
                    estimates={eligibility.costEstimates ?? []}
                    compareList={compareList}
                    onToggleCompare={toggleCompare}
                  />
                  {compareCards.length >= 2 && (
                    <PlanComparison plans={compareCards} onRemove={id => setCompareList(prev => prev.filter(p => p !== id))} />
                  )}
                </div>
              )}

              {exploreSubTab === 'costs' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      Costs are estimated ranges based on your health profile. The AI recommendation accounts for both cost and coverage quality.
                    </p>
                  </div>
                  <CostEstimator
                    profile={profile}
                    eligiblePlans={eligibility.eligiblePlans}
                    primaryRecommendation={eligibility.primaryRecommendation}
                    onSeeFullPlans={() => setExploreSubTab('plans')}
                    documentPlans={documents.filter(d => d.planDetails && Object.values(d.planDetails).some(v => v))}
                  />
                </div>
              )}

              {exploreSubTab === 'network' && (
                <div className="space-y-4">
                  {profile.preferredDoctors && (
                    <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                      Pre-filled from your profile: {profile.preferredDoctors}
                    </div>
                  )}
                  <NetworkChecker
                    profile={profile}
                    eligiblePlans={eligibility.eligiblePlans}
                    planCards={planCards}
                  />
                </div>
              )}

            </div>
          </>
        )}

        {/* ─── TOOLS TAB ──────────────────────────────────────────── */}
        {tab === 'tools' && (
          <>
            {/* Sub-tab bar */}
            <div className="bg-white border-b border-gray-100 px-4">
              <div className="flex gap-0 max-w-2xl mx-auto">
                {([
                  { id: 'chat' as ToolsSubTab, icon: MessageCircle, label: 'AI Navigator' },
                  { id: 'documents' as ToolsSubTab, icon: FileText, label: 'Documents' },
                ] as const).map(st => (
                  <button
                    key={st.id}
                    onClick={() => setToolsSubTab(st.id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                      toolsSubTab === st.id
                        ? 'border-brand-500 text-brand-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <st.icon className="w-3.5 h-3.5" />
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {toolsSubTab === 'chat' && (
              <div className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 255px)' }}>
                <ChatInterface
                  userProfile={profile}
                  autoSendPrompt={chatAutoPrompt}
                  onAutoPromptSent={() => setChatAutoPrompt(undefined)}
                />
              </div>
            )}

            {toolsSubTab === 'documents' && (
              <div className="max-w-2xl mx-auto px-6 py-8 w-full">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Documents</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload insurance cards, EOBs, or plan summaries. The AI extracts key details, deadlines, and flags potential issues.
                </p>
                <DocumentHub
                  userProfile={profile}
                  documents={documents}
                  onDocumentsChange={setDocuments}
                  onDenialDetected={handleDenialDetected}
                />
              </div>
            )}
          </>
        )}

        {/* ─── HELP TAB ───────────────────────────────────────────── */}
        {tab === 'help' && (
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-10 w-full">

            {/* Appeal assistant */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-4 h-4 text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900">Appeal Assistant</h3>
              </div>
              <AppealAssistant userProfile={profile} eligibilityResult={eligibility} />
            </section>

            {/* Navigator finder */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="w-4 h-4 text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900">Find a Navigator or Broker</h3>
              </div>
              <div className="space-y-2">
                {[
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
                    description: 'Apply for Medicaid directly through your state\'s portal or Medicaid.gov.',
                    url: 'https://www.medicaid.gov/about-us/contact-us/contact-your-state-medicaid-office/index.html',
                    tag: 'Medicaid.gov',
                  },
                  {
                    label: 'Find a community health center',
                    description: 'Federally Qualified Health Centers provide sliding-scale care regardless of insurance status.',
                    url: 'https://findahealthcenter.hrsa.gov/',
                    tag: 'HRSA.gov',
                  },
                ].map(resource => (
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
                    <ExternalLink className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-brand-400 mt-0.5" />
                  </a>
                ))}
              </div>
            </section>

            {/* Glossary */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-4 h-4 text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900">Glossary</h3>
              </div>
              <GlossarySearch />
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
