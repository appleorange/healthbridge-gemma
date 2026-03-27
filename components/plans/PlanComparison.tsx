'use client'
import { X, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import type { PlanCard } from '@/types'

interface Props {
  plans: PlanCard[]
  onRemove: (planId: string) => void
}

const ROWS: { label: string; key: keyof PlanCard | 'premium' }[] = [
  { label: 'Monthly premium', key: 'premium' },
  { label: 'Deductible', key: 'deductible' },
  { label: 'Out-of-pocket max', key: 'oopMax' },
  { label: 'PCP copay', key: 'pcpCopay' },
  { label: 'Specialist copay', key: 'specialistCopay' },
  { label: 'Network type', key: 'networkType' },
  { label: 'Metal tier', key: 'metalTier' },
  { label: 'Rating', key: 'rating' },
  { label: 'Fit score', key: 'fitScore' },
]

function formatValue(plan: PlanCard, key: typeof ROWS[0]['key']): string {
  if (key === 'premium') {
    const p = plan.subsidizedPremium ?? plan.monthlyPremium
    return `$${p}/mo${plan.subsidizedPremium !== undefined && plan.subsidizedPremium < plan.monthlyPremium ? ' (after subsidy)' : ''}`
  }
  const v = plan[key as keyof PlanCard]
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') {
    if (key === 'fitScore') return `${v}/100`
    if (key === 'rating') return `${(v as number).toFixed(1)} ★`
    return `$${(v as number).toLocaleString()}`
  }
  return String(v)
}

export default function PlanComparison({ plans, onRemove }: Props) {
  if (plans.length === 0) return null

  // Collect all unique benefit labels
  const allBenefits = Array.from(
    new Set(plans.flatMap(p => p.benefits.map(b => b.label)))
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Plan Comparison ({plans.length} plans)
        </h3>
        <p className="text-xs text-gray-400">Select up to 3 plans to compare</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-gray-400 font-medium w-28 min-w-[7rem]">Plan</th>
              {plans.map(plan => (
                <th key={plan.id} className="py-3 px-4 text-center min-w-[140px]">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-start gap-1">
                      <span className="font-semibold text-gray-800 leading-tight">{plan.name}</span>
                      <button
                        onClick={() => onRemove(plan.id)}
                        className="text-gray-300 hover:text-gray-500 flex-shrink-0 mt-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-gray-400">{plan.issuer}</span>
                    {plan.isPrimaryRecommendation && (
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(row => (
              <tr key={row.label} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 px-4 text-gray-500 font-medium">{row.label}</td>
                {plans.map(plan => (
                  <td key={plan.id} className="py-3 px-4 text-center text-gray-800 font-medium">
                    {formatValue(plan, row.key)}
                  </td>
                ))}
              </tr>
            ))}

            {/* Benefits rows */}
            {allBenefits.length > 0 && (
              <>
                <tr className="bg-gray-50">
                  <td colSpan={plans.length + 1} className="py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Benefits
                  </td>
                </tr>
                {allBenefits.map(benefit => (
                  <tr key={benefit} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 text-gray-500">{benefit}</td>
                    {plans.map(plan => {
                      const b = plan.benefits.find(b => b.label === benefit)
                      return (
                        <td key={plan.id} className="py-2.5 px-4 text-center">
                          {b ? (
                            b.covered
                              ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                              : <XCircle className="w-4 h-4 text-gray-200 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Action row */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `7rem repeat(${plans.length}, 1fr)` }}>
        <div />
        {plans.map(plan => (
          <div key={plan.id}>
            {plan.planUrl ? (
              <a
                href={plan.planUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-all"
              >
                Select <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-all">
                Select plan
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
