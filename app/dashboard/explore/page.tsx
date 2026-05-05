'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Sparkles } from 'lucide-react'
import CostEstimator from '@/components/calculators/CostEstimator'
import PlanCards from '@/components/plans/PlanCards'
import PlanComparison from '@/components/plans/PlanComparison'
import NetworkChecker from '@/components/network/NetworkChecker'
import { PLAN_INFO } from '@/lib/dashboard/plan-info'
import type { UserProfile, EligibilityResult, PlanCard, ParsedDocument } from '@/types'

type ExploreTab = 'plans' | 'costs' | 'network'

const SUB_TABS: { id: ExploreTab; label: string }[] = [
  { id: 'plans', label: 'Plans near me' },
  { id: 'costs', label: 'Cost breakdown' },
  { id: 'network', label: 'Network checker' },
]

export default function ExplorePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null)
  const [tab, setTab] = useState<ExploreTab>('plans')

  const [planCards, setPlanCards] = useState<PlanCard[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(sessionStorage.getItem('hb_plan_cards') ?? '[]') } catch { return [] }
  })
  const [plansLoading, setPlansLoading] = useState(false)
  const [plansFetched, setPlansFetched] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('hb_plans_fetched') === 'true'
  })
  const [compareList, setCompareList] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(sessionStorage.getItem('hb_compare_list') ?? '[]') } catch { return [] }
  })
  const [documents, setDocuments] = useState<ParsedDocument[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(sessionStorage.getItem('hb_documents') ?? '[]') } catch { return [] }
  })

  useEffect(() => {
    const p = sessionStorage.getItem('hb_profile')
    const e = sessionStorage.getItem('hb_eligibility')
    if (!p || !e) { router.push('/onboarding'); return }
    const parsedProfile = JSON.parse(p) as UserProfile
    const parsedEligibility = JSON.parse(e) as EligibilityResult
    setProfile(parsedProfile)
    setEligibility(parsedEligibility)
    // Auto-fetch plans on mount if not already fetched
    if (sessionStorage.getItem('hb_plans_fetched') !== 'true') {
      fetchPlans(parsedProfile, parsedEligibility)
    }
  }, [router])

  useEffect(() => {
    sessionStorage.setItem('hb_compare_list', JSON.stringify(compareList))
  }, [compareList])

  async function fetchPlans(p: UserProfile, e: EligibilityResult) {
    setPlansLoading(true)
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: p,
          eligiblePlans: e.eligiblePlans,
          primaryRecommendation: e.primaryRecommendation,
        }),
      })
      const data = await res.json()
      const cards = data.plans ?? []
      setPlanCards(cards)
      setPlansFetched(true)
      sessionStorage.setItem('hb_plan_cards', JSON.stringify(cards))
      sessionStorage.setItem('hb_plans_fetched', 'true')
    } catch {
      setPlansFetched(true)
    } finally {
      setPlansLoading(false)
    }
  }

  function toggleCompare(planId: string) {
    setCompareList(prev => {
      if (prev.includes(planId)) return prev.filter(id => id !== planId)
      if (prev.length >= 3) return prev
      return [...prev, planId]
    })
  }

  if (!profile || !eligibility) {
    return (
      <div className="min-h-full flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const primary = PLAN_INFO[eligibility.primaryRecommendation] ?? PLAN_INFO['none']
  const compareCards = planCards.filter(p => compareList.includes(p.id))

  return (
    <div className="flex flex-col">
      {/* Sub-tab bar */}
      <div className="bg-white border-b border-gray-100 px-4 sticky top-0 z-10">
        <div className="flex gap-0 max-w-2xl mx-auto">
          {SUB_TABS.map(st => (
            <button
              key={st.id}
              onClick={() => setTab(st.id)}
              className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-all ${
                tab === st.id
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

        {tab === 'plans' && (
          <div className="space-y-6">
            <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-sm text-brand-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
                <span>AI recommends: <strong>{primary.label}</strong></span>
              </div>
              <button onClick={() => router.push('/dashboard')} className="text-xs text-brand-600 font-medium whitespace-nowrap">
                Why? →
              </button>
            </div>
            <p className="text-xs text-gray-500 -mt-2 px-1">
              The plans below are ACA Marketplace options available near you based on your ZIP code — not necessarily your top recommendation above. They&apos;re shown so you can compare costs if your situation changes.
            </p>
            {!profile.zipCode && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
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
              <PlanComparison
                plans={compareCards}
                onRemove={id => setCompareList(prev => prev.filter(p => p !== id))}
              />
            )}
          </div>
        )}

        {tab === 'costs' && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Costs are estimated ranges based on your health profile. The AI recommendation accounts for both cost and coverage quality.
              </p>
            </div>
            <CostEstimator
              profile={profile}
              eligiblePlans={eligibility.eligiblePlans}
              primaryRecommendation={eligibility.primaryRecommendation}
              onSeeFullPlans={() => setTab('plans')}
              documentPlans={documents.filter(d => d.planDetails && Object.values(d.planDetails).some(v => v))}
            />
          </div>
        )}

        {tab === 'network' && (
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
    </div>
  )
}
