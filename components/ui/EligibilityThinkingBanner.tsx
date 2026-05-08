'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, Circle, Brain } from 'lucide-react'

const STEP_META: Record<number, { label: string; citation: string; cite_short: string }> = {
  1: {
    label: 'Marketplace eligibility',
    citation: 'ACA § 1312(f) — immigration status and marketplace access',
    cite_short: 'ACA § 1312(f)',
  },
  2: {
    label: 'Medicaid & CHIP rules',
    citation: '42 USC § 1396b — federal Medicaid participation requirements',
    cite_short: '42 USC § 1396b',
  },
  3: {
    label: '5-year immigration bar',
    citation: 'PRWORA § 403(a) — 5-year waiting period for federal benefit programs',
    cite_short: 'PRWORA § 403(a)',
  },
  4: {
    label: 'Subsidy / APTC calculation',
    citation: 'IRC § 36B — Premium Tax Credit eligibility and income thresholds',
    cite_short: 'IRC § 36B',
  },
  5: {
    label: 'Plan recommendation',
    citation: '45 CFR § 155.305 — ACA eligibility determination standards',
    cite_short: '45 CFR § 155.305',
  },
}

export default function EligibilityThinkingBanner() {
  const [firedSteps, setFiredSteps] = useState<number[]>([])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('hb_thinking_steps')
      if (raw) setFiredSteps(JSON.parse(raw) as number[])
    } catch {}
  }, [])

  if (firedSteps.length === 0) return null

  const firedSet = new Set(firedSteps)
  const allSteps = [1, 2, 3, 4, 5]

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-brand-50 rounded-full flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-brand-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Verified by Gemma 4 reasoning</p>
          <p className="text-xs text-gray-400">Rules checked during your eligibility analysis — running locally, no data sent</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {allSteps.map(step => {
          const meta = STEP_META[step]
          const fired = firedSet.has(step)
          return (
            <div key={step} className="flex items-start gap-2.5">
              {fired ? (
                <CheckCircle className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-200 mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <span className={`text-sm ${fired ? 'text-gray-800' : 'text-gray-300'}`}>
                  {meta.label}
                </span>
                {fired && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate" title={meta.citation}>
                    {meta.cite_short}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
