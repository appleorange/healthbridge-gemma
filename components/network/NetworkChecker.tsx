'use client'
import { useState, useEffect, useRef } from 'react'
import { CheckCircle, XCircle, HelpCircle, Phone, AlertTriangle, Stethoscope, Loader2 } from 'lucide-react'
import type { UserProfile, PlanType, PlanCard } from '@/types'
import type { NetworkCheckResult } from '@/app/api/network-check/route'

interface Props {
  profile: UserProfile
  eligiblePlans: PlanType[]
  planCards: PlanCard[]
}

type ProviderType = 'doctor' | 'hospital' | 'any'

interface PlanResult {
  plan: PlanCard
  result: NetworkCheckResult | null
  loading: boolean
  error: boolean
}

const CONFIDENCE_BADGE: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed via CMS', className: 'bg-green-100 text-green-700' },
  likely:    { label: 'AI estimate — verify with plan', className: 'bg-amber-100 text-amber-700' },
  unknown:   { label: 'Unknown — call plan to verify', className: 'bg-gray-100 text-gray-600' },
}

export default function NetworkChecker({ profile, planCards }: Props) {
  const [providerName, setProviderName] = useState(profile.preferredDoctors ?? '')
  const [providerType, setProviderType] = useState<ProviderType>('doctor')
  const [zipCode, setZipCode] = useState(profile.zipCode ?? '')
  const [results, setResults] = useState<PlanResult[]>([])
  const [hasChecked, setHasChecked] = useState(false)
  const autoRunRef = useRef(false)

  // Only check the top 4 plans to avoid too many simultaneous calls
  const plansToCheck = planCards.slice(0, 4)

  async function checkNetwork(name: string, type: ProviderType, zip: string) {
    if (!name.trim() || !zip.trim()) return

    // Initialize all results as loading
    const initial: PlanResult[] = plansToCheck.map(plan => ({
      plan,
      result: null,
      loading: true,
      error: false,
    }))
    setResults(initial)
    setHasChecked(true)

    // Fire all checks in parallel
    await Promise.all(
      plansToCheck.map(async (plan, idx) => {
        try {
          const res = await fetch('/api/network-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerName: name.trim(),
              providerType: type,
              zipCode: zip,
              planId: plan.isReal ? plan.id : undefined,
              planName: plan.name,
            }),
          })
          const data: NetworkCheckResult = await res.json()
          setResults(prev => prev.map((r, i) => i === idx ? { ...r, result: data, loading: false } : r))
        } catch {
          setResults(prev => prev.map((r, i) => i === idx ? { ...r, loading: false, error: true } : r))
        }
      })
    )
  }

  // Auto-run if preferredDoctors is pre-populated
  useEffect(() => {
    if (profile.preferredDoctors && !autoRunRef.current && plansToCheck.length > 0) {
      autoRunRef.current = true
      checkNetwork(profile.preferredDoctors, 'doctor', profile.zipCode ?? '')
    }
  }, [plansToCheck.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    checkNetwork(providerName, providerType, zipCode)
  }

  return (
    <div className="space-y-6">
      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Doctor or hospital name
          </label>
          <input
            type="text"
            value={providerName}
            onChange={e => setProviderName(e.target.value)}
            placeholder="e.g. Dr. Sarah Chen, UPMC Presbyterian, Cleveland Clinic"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {(['doctor', 'hospital', 'any'] as ProviderType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setProviderType(t)}
                  className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                    providerType === t
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {t === 'any' ? 'Any' : t === 'doctor' ? 'Doctor' : 'Hospital'}
                </button>
              ))}
            </div>
          </div>

          <div className="w-32">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">ZIP code</label>
            <input
              type="text"
              value={zipCode}
              onChange={e => setZipCode(e.target.value)}
              placeholder="e.g. 15213"
              maxLength={5}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!providerName.trim() || !zipCode.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Stethoscope className="w-4 h-4" />
          Check network
        </button>
      </form>

      {/* Results */}
      {hasChecked && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Network status for &ldquo;{results[0]?.result?.providerName ?? providerName}&rdquo;
          </p>

          {results.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No plans to check. Add your ZIP code to load plans first.
            </p>
          )}

          {results.map(({ plan, result, loading, error }) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-4 ${
                result?.inNetwork === true ? 'border-green-200 bg-green-50'
                : result?.inNetwork === false ? 'border-red-200 bg-red-50'
                : 'border-gray-100 bg-white'
              }`}
            >
              {/* Plan header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{plan.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border mt-1 inline-block ${
                    plan.networkType === 'HMO' ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : plan.networkType === 'PPO' ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {plan.networkType}
                  </span>
                </div>

                {/* Status indicator */}
                {loading ? (
                  <Loader2 className="w-6 h-6 text-gray-300 animate-spin flex-shrink-0" />
                ) : error ? (
                  <HelpCircle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                ) : result?.inNetwork === true ? (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                ) : result?.inNetwork === false ? (
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                ) : (
                  <HelpCircle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                )}
              </div>

              {loading && (
                <p className="text-xs text-gray-400">Checking network status…</p>
              )}

              {error && (
                <p className="text-xs text-gray-400">Could not check this plan. Call the number on your insurance card.</p>
              )}

              {!loading && !error && result && (
                <div className="space-y-2">
                  {/* In-network status */}
                  <p className={`text-sm font-semibold ${
                    result.inNetwork === true ? 'text-green-700'
                    : result.inNetwork === false ? 'text-red-700'
                    : 'text-gray-600'
                  }`}>
                    {result.inNetwork === true ? 'In network'
                    : result.inNetwork === false ? 'Out of network'
                    : 'Could not confirm'}
                  </p>

                  {/* Address/specialty if known */}
                  {result.address && (
                    <p className="text-xs text-gray-500">{result.address}</p>
                  )}
                  {result.specialty && (
                    <p className="text-xs text-gray-500">{result.specialty}</p>
                  )}

                  {/* Copay info for in-network */}
                  {result.inNetwork === true && (
                    <div className="flex gap-3 mt-2">
                      {plan.pcpCopay !== null && providerType !== 'hospital' && (
                        <div className="bg-green-100 rounded-lg px-3 py-1.5 text-center">
                          <p className="text-xs text-green-600">PCP visit copay</p>
                          <p className="text-sm font-semibold text-green-800">${plan.pcpCopay}</p>
                        </div>
                      )}
                      {plan.specialistCopay !== null && (
                        <div className="bg-green-100 rounded-lg px-3 py-1.5 text-center">
                          <p className="text-xs text-green-600">Specialist copay</p>
                          <p className="text-sm font-semibold text-green-800">${plan.specialistCopay}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Out-of-network warning */}
                  {result.inNetwork === false && (
                    <div className="flex gap-2 mt-2 p-2.5 bg-red-100 rounded-xl">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">
                        {plan.networkType === 'HMO'
                          ? 'This plan uses an HMO network — out-of-network care is not covered except emergencies. You would pay the full cost out of pocket.'
                          : 'Out-of-network care typically costs 20–50% more under PPO plans. Coinsurance applies after your deductible.'}
                      </p>
                    </div>
                  )}

                  {/* AI reasoning */}
                  {result.source === 'ai_estimate' && result.reasoning && (
                    <p className="text-xs text-gray-500 mt-1">{result.reasoning}</p>
                  )}

                  {/* Suggestion for null/unknown */}
                  {result.inNetwork === null && result.suggestion && (
                    <p className="text-xs text-gray-500 mt-1">{result.suggestion}</p>
                  )}

                  {/* Confidence badge + call to verify */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONFIDENCE_BADGE[result.confidence]?.className ?? 'bg-gray-100 text-gray-600'}`}>
                      {CONFIDENCE_BADGE[result.confidence]?.label ?? 'Unknown'}
                    </span>
                    <button className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                      <Phone className="w-3 h-3" />
                      Call to verify
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
        Network status can change. Always verify directly with your plan before scheduling care.
      </p>
    </div>
  )
}
