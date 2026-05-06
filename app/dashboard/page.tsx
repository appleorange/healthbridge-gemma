'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Shield, CheckCircle, AlertCircle, Clock, ChevronRight,
  Compass, Wrench, HelpCircle, Sparkles, GitBranch,
  Calendar, ChevronDown, ChevronUp, MessageCircle, FileText, Scale, ListChecks
} from 'lucide-react'
import EligibilityFlowchart from '@/components/flowchart/EligibilityFlowchart'
import EnrollmentTimeline from '@/components/timeline/EnrollmentTimeline'
import ActionChecklist from '@/components/checklist/ActionChecklist'
import TrustBanner from '@/components/ui/TrustBanner'
import LanguageToggle from '@/components/ui/LanguageToggle'
import { useLanguage } from '@/hooks/useLanguage'
import { ES_DASHBOARD } from '@/lib/i18n/es'
import { PLAN_INFO } from '@/lib/dashboard/plan-info'
import type { UserProfile, EligibilityResult, PlanType, ParsedDocument, ChecklistItem } from '@/types'

export default function DashboardHomePage() {
  const router = useRouter()
  const [lang, setLang] = useLanguage()
  const t = lang === 'es' ? ES_DASHBOARD : null
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null)
  const [expandedPlan, setExpandedPlan] = useState<PlanType | null>(null)
  const [showFlowchart, setShowFlowchart] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [documents, setDocuments] = useState<ParsedDocument[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[] | null>(null)
  const [checklistLoading, setChecklistLoading] = useState(false)

  useEffect(() => {
    let parsedProfile: UserProfile
    let parsedEligibility: EligibilityResult
    try {
      const p = sessionStorage.getItem('hb_profile')
      const e = sessionStorage.getItem('hb_eligibility')
      if (!p || !e) { router.push('/onboarding'); return }
      parsedProfile = JSON.parse(p) as UserProfile
      parsedEligibility = JSON.parse(e) as EligibilityResult
      setProfile(parsedProfile)
      setEligibility(parsedEligibility)
      try { setDocuments(JSON.parse(sessionStorage.getItem('hb_documents') ?? '[]')) } catch {}
    } catch { router.push('/onboarding'); return }

    const cached = sessionStorage.getItem('hb_checklist')
    if (cached) {
      try { setChecklist(JSON.parse(cached)); return } catch {}
    }
    setChecklistLoading(true)
    fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: parsedProfile, eligibility: parsedEligibility, language: sessionStorage.getItem('hb_lang') ?? 'en' }),
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.items)) {
          setChecklist(data.items)
          sessionStorage.setItem('hb_checklist', JSON.stringify(data.items))
        }
      })
      .catch(() => {})
      .finally(() => setChecklistLoading(false))
  }, [router])

  if (!profile || !eligibility) {
    return (
      <div className="min-h-full flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const primary = PLAN_INFO[eligibility.primaryRecommendation] ?? PLAN_INFO['none']
  const costEst = eligibility.costEstimates?.find(e => e.planType === eligibility.primaryRecommendation)
  const costLabel = costEst
    ? (costEst.estimatedMonthlyPremium.low === costEst.estimatedMonthlyPremium.high
        ? `$${costEst.estimatedMonthlyPremium.low}`
        : `$${costEst.estimatedMonthlyPremium.low}–$${costEst.estimatedMonthlyPremium.high}`)
    : null
  const docDeadlines = documents.flatMap(d => (d.deadlines ?? []).map(dl => ({ ...dl, fileName: d.fileName })))

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6 w-full">

      {/* Recommendation banner */}
      <div className="bg-brand-600 rounded-2xl p-5 text-white">
        <p className="text-brand-200 text-xs font-semibold uppercase tracking-wide mb-1">{t?.bestOption ?? 'Best option for your situation'}</p>
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <h2 className="text-xl font-bold">{primary.label}</h2>
          {costLabel && (
            <span className="text-xs bg-brand-500 border border-brand-400 px-2.5 py-1 rounded-full font-medium">
              Est. {costLabel}/mo
            </span>
          )}
        </div>
        {(eligibility.visaEligibilitySummary || eligibility.bestOptionReasoning) && (
          <p className="text-brand-100 text-sm leading-relaxed mb-4">
            {eligibility.visaEligibilitySummary || eligibility.bestOptionReasoning}
          </p>
        )}
        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard/explore" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-all border border-white/20">
            <Compass className="w-3.5 h-3.5" /> {t?.explorePlans ?? 'Explore plans'}
          </Link>
          <Link href="/dashboard/tools" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-all border border-white/20">
            <MessageCircle className="w-3.5 h-3.5" /> {t?.askAI ?? 'Ask AI'}
          </Link>
          <Link href="/dashboard/tools" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-all border border-white/20">
            <FileText className="w-3.5 h-3.5" /> {t?.uploadDocs ?? 'Upload docs'}
          </Link>
        </div>
      </div>

      <TrustBanner
        text={t?.trustBanner ?? 'For informational use only — not legal or insurance advice. Rules are based on current ACA and federal eligibility guidelines.'}
        verifyUrl="https://www.healthcare.gov"
        verifyLabel={t?.verifyLabel ?? 'Verify on healthcare.gov →'}
      />

      {/* Action checklist */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t?.yourChecklist ?? 'Your action checklist'}</h3>
        </div>
        {checklistLoading && (
          <div className="flex items-center gap-2 p-4 bg-white border border-gray-100 rounded-xl text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin shrink-0" />
            {t?.generatingChecklist ?? 'Generating your personalized checklist…'}
          </div>
        )}
        {checklist && checklist.length > 0 && <ActionChecklist items={checklist} />}
      </section>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/dashboard/explore', icon: Compass, label: t?.plans ?? 'Plans & Cost', color: 'text-brand-600 bg-brand-50' },
          { href: '/dashboard/tools', icon: Wrench, label: t?.tools ?? 'Tools', color: 'text-blue-600 bg-blue-50' },
          { href: '/dashboard/help', icon: HelpCircle, label: t?.help ?? 'Help', color: 'text-gray-600 bg-gray-100' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl hover:border-brand-200 hover:shadow-sm transition-all text-center group"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
              <item.icon className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-medium text-gray-700 group-hover:text-brand-700">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Eligible plans */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t ? t.plansQualify(eligibility.eligiblePlans?.length ?? 0) : `Plans you qualify for (${eligibility.eligiblePlans?.length ?? 0})`}
        </h3>
        <div className="space-y-2">
          {(eligibility.eligiblePlans ?? []).map(plan => {
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
                  <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${isPrimary ? 'text-brand-500' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${isPrimary ? 'text-brand-800' : 'text-gray-800'}`}>
                        {info.label}
                      </p>
                      {isPrimary && (
                        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> {t?.recommended ?? 'Recommended'}
                        </span>
                      )}
                      {est && (
                        <span className="text-xs text-gray-400">
                          ~{est.estimatedMonthlyPremium.low === est.estimatedMonthlyPremium.high
                            ? `$${est.estimatedMonthlyPremium.low}`
                            : `$${est.estimatedMonthlyPremium.low}–$${est.estimatedMonthlyPremium.high}`}/mo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{info.description}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform mt-0.5 ${isExpanded ? 'rotate-90' : ''} ${isPrimary ? 'text-brand-400' : 'text-gray-300'}`} />
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
      {(eligibility.specialCircumstances?.length ?? 0) > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t?.importantNotes ?? 'Important notes'}</h3>
          <div className="space-y-2">
            {(eligibility.specialCircumstances ?? []).map((note, i) => (
              <div key={i} className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Next steps */}
      {(eligibility.nextSteps?.length ?? 0) > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t?.nextSteps ?? 'Next steps'}</h3>
          <div className="space-y-2">
            {(eligibility.nextSteps ?? []).map(step => (
              <div key={step.id} className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  step.priority === 'high' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <Clock className={`w-3 h-3 ${step.priority === 'high' ? 'text-red-500' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  {step.deadline && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{t?.deadline ?? 'Deadline'}: {step.deadline}</p>
                  )}
                </div>
                {step.actionUrl && (
                  <a href={step.actionUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">
                    <ChevronRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Document deadlines */}
      {docDeadlines.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t ? t.fromDocuments(documents.length) : `From your documents (${documents.length})`}
          </h3>
          <div className="space-y-2">
            {docDeadlines.map((dl, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${dl.urgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-100'}`}>
                <div className="flex items-start gap-2 min-w-0">
                  <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${dl.urgent ? 'text-red-500' : 'text-amber-500'}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${dl.urgent ? 'text-red-800' : 'text-amber-800'}`}>{dl.label}</p>
                    <p className="text-xs text-gray-400 truncate">{dl.fileName}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold whitespace-nowrap ml-2 ${dl.urgent ? 'text-red-600' : 'text-amber-600'}`}>{dl.date}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Eligibility flowchart (collapsible) */}
      <section>
        <button
          onClick={() => setShowFlowchart(s => !s)}
          className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all"
        >
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">{t?.howDecided ?? 'How was this decided?'}</span>
            <span className="text-xs text-gray-400">{t?.seeRules ?? 'See the rules behind your eligibility'}</span>
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
            <span className="text-sm font-semibold text-gray-700">{t?.enrollmentCalendar ?? 'Enrollment calendar'}</span>
            <span className="text-xs text-gray-400">{t?.keyDates ?? 'Key dates and deadlines'}</span>
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
      {(eligibility.ineligiblePlans?.length ?? 0) > 0 && (
        <section className="pb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t?.plansNotQualify ?? "Plans you don't qualify for"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(eligibility.ineligiblePlans ?? []).map(plan => (
              <span key={plan} className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full line-through">
                {PLAN_INFO[plan].label}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {t?.expandWhy ?? 'Expand "Why this route?" above to see the legal reasons behind each decision.'}
          </p>
        </section>
      )}

    </div>
  )
}
