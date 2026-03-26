'use client'
import { useMemo } from 'react'
import { DollarSign, TrendingDown, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { estimateCosts, calculateSubsidy } from '@/lib/calculators/cost-estimator'
import type { UserProfile, PlanType } from '@/types'

interface Props {
  profile: UserProfile
  eligiblePlans: PlanType[]
  primaryRecommendation?: PlanType
}

const CSR_LABELS = {
  silver_94: 'Silver 94 — deductible as low as $75',
  silver_87: 'Silver 87 — deductible as low as $500',
  silver_73: 'Silver 73 — deductible as low as $1,400',
}

export default function CostEstimator({ profile, eligiblePlans, primaryRecommendation }: Props) {
  const rawEstimates = useMemo(() => estimateCosts(profile, eligiblePlans), [profile, eligiblePlans])
  const subsidy = useMemo(() => calculateSubsidy(profile), [profile])

  // Sort so AI-recommended plan appears first, rest remain sorted by cost
  const estimates = useMemo(() => {
    if (!primaryRecommendation) return rawEstimates
    const idx = rawEstimates.findIndex(e => e.planType === primaryRecommendation)
    if (idx <= 0) return rawEstimates
    const sorted = [...rawEstimates]
    const [recommended] = sorted.splice(idx, 1)
    sorted.unshift(recommended)
    return sorted
  }, [rawEstimates, primaryRecommendation])

  const cheapest = rawEstimates[0]

  return (
    <div className="space-y-6">

      {/* Subsidy / ACA eligibility banner */}
      {(subsidy.qualifiesForPTC || subsidy.medicaidEligible || subsidy.qualifiesForCSR) && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-green-800">You qualify for financial assistance</p>
          </div>

          {subsidy.medicaidEligible && (
            <div className="text-sm text-green-700 bg-green-100 rounded-xl px-3 py-2">
              <span className="font-medium">Medicaid eligible</span> — $0 premium, minimal cost-sharing. Apply first.
            </div>
          )}

          {subsidy.qualifiesForPTC && !subsidy.medicaidEligible && (
            <div className="text-sm text-green-700 bg-green-100 rounded-xl px-3 py-2">
              <span className="font-medium">Premium Tax Credit:</span> ~${subsidy.estimatedMonthlyCredit.low}–${subsidy.estimatedMonthlyCredit.high}/month off your ACA premium
              <span className="text-green-600 ml-1">({subsidy.fplPercentage}% FPL)</span>
            </div>
          )}

          {subsidy.qualifiesForCSR && (
            <div className="text-sm text-green-700 bg-green-100 rounded-xl px-3 py-2">
              <span className="font-medium">Cost-Sharing Reduction:</span>{' '}
              {subsidy.csrLevel ? CSR_LABELS[subsidy.csrLevel] : 'Reduced deductibles on Silver plans'}
            </div>
          )}

          {subsidy.chipEligible && (
            <div className="text-sm text-green-700 bg-green-100 rounded-xl px-3 py-2">
              <span className="font-medium">CHIP eligible</span> — your children may qualify for low-cost coverage
            </div>
          )}
        </div>
      )}

      {/* Subsidy notes for ineligible users */}
      {!subsidy.qualifiesForPTC && !subsidy.medicaidEligible && subsidy.notes.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-800">About your subsidy eligibility</p>
          </div>
          {subsidy.notes.map((note, i) => (
            <p key={i} className="text-sm text-amber-700">{note}</p>
          ))}
        </div>
      )}

      {/* Usage assumptions summary */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Based on your health profile</p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full capitalize">
            {profile.expectedHealthcareUsage ?? 'moderate'} usage
          </span>
          {profile.takesRegularMedications && (
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
              {profile.numberOfPrescriptions ?? 1}+ prescriptions
            </span>
          )}
          {profile.hasChronicConditions && (
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">Chronic condition(s)</span>
          )}
          {profile.expectsSurgeryOrProcedure && (
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">Planned procedure</span>
          )}
          {profile.preferredDoctors && (
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full">Preferred providers noted</span>
          )}
        </div>
        {profile.monthlyPremiumBudget && profile.monthlyPremiumBudget !== 'flexible' && (
          <p className="text-xs text-gray-400 mt-2">
            Budget: {
              profile.monthlyPremiumBudget === 'under_100' ? 'under $100/mo' :
              profile.monthlyPremiumBudget === '100_to_300' ? '$100–$300/mo' :
              profile.monthlyPremiumBudget === '300_to_500' ? '$300–$500/mo' : 'over $500/mo'
            }
          </p>
        )}
      </div>

      {/* Cost estimate cards */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Estimated annual cost by plan
        </p>

        {estimates.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-8">
            No cost estimates available — complete your health profile to see projections.
          </div>
        )}

        <div className="space-y-3">
          {estimates.map((est, i) => {
            const isAIRecommended = est.planType === primaryRecommendation
            const isCheapest = est.planType === cheapest?.planType && !isAIRecommended
            const highlighted = isAIRecommended || (i === 0 && !primaryRecommendation)
            const overBudget = profile.monthlyPremiumBudget &&
              profile.monthlyPremiumBudget !== 'flexible' &&
              est.estimatedMonthlyPremium.low > ({
                under_100: 100, '100_to_300': 300, '300_to_500': 500, over_500: Infinity
              }[profile.monthlyPremiumBudget] ?? Infinity)

            return (
              <div
                key={est.planType}
                className={`rounded-2xl border p-4 ${
                  highlighted
                    ? 'border-brand-200 bg-brand-50'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${highlighted ? 'text-brand-800' : 'text-gray-800'}`}>
                        {est.planLabel}
                      </p>
                      {isAIRecommended && (
                        <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.09 8.26L2 9.27l5 4.87L5.82 21 12 17.77 18.18 21 17 14.14l5-4.87-7.09-1.01z"/></svg>
                          AI recommended
                        </span>
                      )}
                      {isCheapest && (
                        <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full font-medium">
                          Lowest cost
                        </span>
                      )}
                      {overBudget && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Over budget
                        </span>
                      )}
                      {est.subsidyApplied > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" /> Subsidy applied
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${highlighted ? 'text-brand-600' : 'text-gray-400'}`}>
                      {est.bestFor}
                    </p>
                  </div>
                </div>

                {/* Cost breakdown row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className={`rounded-xl p-2.5 text-center ${highlighted ? 'bg-brand-100' : 'bg-gray-50'}`}>
                    <p className={`text-xs mb-1 ${highlighted ? 'text-brand-600' : 'text-gray-400'}`}>Monthly premium</p>
                    <p className={`text-sm font-semibold ${highlighted ? 'text-brand-800' : 'text-gray-700'}`}>
                      ${est.estimatedMonthlyPremium.low === est.estimatedMonthlyPremium.high
                        ? est.estimatedMonthlyPremium.low
                        : `${est.estimatedMonthlyPremium.low}–${est.estimatedMonthlyPremium.high}`}
                    </p>
                  </div>
                  <div className={`rounded-xl p-2.5 text-center ${highlighted ? 'bg-brand-100' : 'bg-gray-50'}`}>
                    <p className={`text-xs mb-1 ${highlighted ? 'text-brand-600' : 'text-gray-400'}`}>Out-of-pocket</p>
                    <p className={`text-sm font-semibold ${highlighted ? 'text-brand-800' : 'text-gray-700'}`}>
                      ${est.estimatedAnnualOutOfPocket.low.toLocaleString()}–{est.estimatedAnnualOutOfPocket.high.toLocaleString()}
                    </p>
                  </div>
                  <div className={`rounded-xl p-2.5 text-center ${highlighted ? 'bg-brand-100' : 'bg-gray-50'}`}>
                    <p className={`text-xs mb-1 ${highlighted ? 'text-brand-600' : 'text-gray-400'}`}>Annual total</p>
                    <p className={`text-sm font-semibold ${highlighted ? 'text-brand-800' : 'text-gray-700'}`}>
                      ${est.estimatedAnnualTotal.low.toLocaleString()}–{est.estimatedAnnualTotal.high.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Assumptions */}
                <div className="space-y-1">
                  {est.assumptions.map((a, j) => (
                    <p key={j} className={`text-xs flex items-start gap-1 ${highlighted ? 'text-brand-600' : 'text-gray-400'}`}>
                      <span className="mt-0.5 opacity-60">·</span> {a}
                    </p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Savings callout */}
      {rawEstimates.length >= 2 && cheapest && (
        <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
          <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              Choosing {cheapest.planLabel} vs {rawEstimates[rawEstimates.length - 1].planLabel} could save you{' '}
              <span className="text-brand-700 font-semibold">
                ${(rawEstimates[rawEstimates.length - 1].estimatedAnnualTotal.low - cheapest.estimatedAnnualTotal.low).toLocaleString()}–
                ${(rawEstimates[rawEstimates.length - 1].estimatedAnnualTotal.high - cheapest.estimatedAnnualTotal.high).toLocaleString()}
              </span>{' '}
              per year.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Estimates are ranges based on typical usage. Actual costs depend on your specific plan and providers.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
