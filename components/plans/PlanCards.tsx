'use client'
import { useState } from 'react'
import { ExternalLink, Star, Bookmark, GitCompare, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Pill, Stethoscope } from 'lucide-react'
import type { PlanCard } from '@/types'

interface Props {
  plans: PlanCard[]
  loading: boolean
}

const NETWORK_COLORS: Record<string, string> = {
  HMO:     'bg-blue-50 text-blue-700 border-blue-200',
  PPO:     'bg-purple-50 text-purple-700 border-purple-200',
  EPO:     'bg-indigo-50 text-indigo-700 border-indigo-200',
  HDHP:    'bg-amber-50 text-amber-700 border-amber-200',
  ISP:     'bg-teal-50 text-teal-700 border-teal-200',
  SHIP:    'bg-green-50 text-green-700 border-green-200',
  Medicaid:'bg-brand-50 text-brand-700 border-brand-200',
  Other:   'bg-gray-50 text-gray-600 border-gray-200',
}

const METAL_COLORS: Record<string, string> = {
  Bronze:      'text-amber-700',
  Silver:      'text-gray-500',
  Gold:        'text-yellow-600',
  Platinum:    'text-indigo-600',
  Catastrophic:'text-red-500',
}

function FitScoreRing({ score }: { score: number }) {
  const radius = 22
  const circ = 2 * Math.PI * radius
  const filled = (score / 100) * circ
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        <circle
          cx="30" cy="30" r={radius} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
        />
        <text x="30" y="35" textAnchor="middle" fontSize="14" fontWeight="600" fill={color}>{score}</text>
      </svg>
      <span className="text-xs text-gray-400">Fit score</span>
    </div>
  )
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      <span className="text-xs text-gray-400 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

function PlanCardItem({ plan, isBest }: { plan: PlanCard; isBest: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)

  const premium = plan.subsidizedPremium ?? plan.monthlyPremium
  const subsidized = plan.subsidizedPremium !== undefined && plan.subsidizedPremium < plan.monthlyPremium

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isBest ? 'border-brand-300 shadow-sm' : 'border-gray-100 bg-white'
    }`}>
      {/* Best match badge */}
      {isBest && (
        <div className="bg-brand-600 text-white text-xs font-semibold px-4 py-1.5 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" /> Your best plan match
        </div>
      )}

      <div className={`p-4 ${isBest ? 'bg-brand-50' : 'bg-white'}`}>
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold leading-tight ${isBest ? 'text-brand-900' : 'text-gray-900'}`}>
              {plan.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{plan.issuer}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${NETWORK_COLORS[plan.networkType]}`}>
                {plan.networkType}
              </span>
              {plan.metalTier && (
                <span className={`text-xs font-medium ${METAL_COLORS[plan.metalTier] ?? ''}`}>
                  {plan.metalTier}
                </span>
              )}
              <span className="text-xs text-gray-400">{plan.year}</span>
              {!plan.isReal && (
                <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Estimated</span>
              )}
            </div>
            <div className="mt-1.5">
              <StarRating rating={plan.rating} />
            </div>
          </div>
          <FitScoreRing score={plan.fitScore} />
        </div>

        {/* Premium highlight */}
        <div className={`rounded-xl p-3 mb-3 text-center ${isBest ? 'bg-brand-100' : 'bg-gray-50'}`}>
          <p className={`text-2xl font-bold ${isBest ? 'text-brand-800' : 'text-gray-800'}`}>
            ${premium}<span className="text-sm font-normal">/mo</span>
          </p>
          {subsidized && (
            <p className="text-xs text-green-600 font-medium mt-0.5">
              After subsidy (was ${plan.monthlyPremium}/mo)
            </p>
          )}
          <p className={`text-xs mt-0.5 ${isBest ? 'text-brand-600' : 'text-gray-400'}`}>Monthly Premium</p>
        </div>

        {/* Copay row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className={`rounded-xl p-2.5 text-center ${isBest ? 'bg-brand-100' : 'bg-gray-50'}`}>
            <p className={`text-base font-semibold ${isBest ? 'text-brand-800' : 'text-gray-700'}`}>
              {plan.pcpCopay !== null ? `$${plan.pcpCopay}` : 'See plan'}
            </p>
            <p className={`text-xs mt-0.5 ${isBest ? 'text-brand-600' : 'text-gray-400'}`}>PCP Copay</p>
          </div>
          <div className={`rounded-xl p-2.5 text-center ${isBest ? 'bg-brand-100' : 'bg-gray-50'}`}>
            <p className={`text-base font-semibold ${isBest ? 'text-brand-800' : 'text-gray-700'}`}>
              {plan.specialistCopay !== null ? `$${plan.specialistCopay}` : 'See plan'}
            </p>
            <p className={`text-xs mt-0.5 ${isBest ? 'text-brand-600' : 'text-gray-400'}`}>Specialist Copay</p>
          </div>
        </div>

        {/* Add drugs / add doctors prompts */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
            isBest ? 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100' : 'border-gray-100 text-gray-500 hover:bg-gray-50'
          }`}>
            <Pill className="w-4 h-4" />
            <span className="text-center leading-tight">Add your drugs<br/>to see costs</span>
          </button>
          <button className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
            isBest ? 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100' : 'border-gray-100 text-gray-500 hover:bg-gray-50'
          }`}>
            <Stethoscope className="w-4 h-4" />
            <span className="text-center leading-tight">Add your doctors<br/>to see coverage</span>
          </button>
        </div>

        {/* Benefits chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {plan.benefits.map(b => (
            <span
              key={b.label}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${
                b.covered
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-300 border-gray-100 line-through'
              }`}
            >
              {b.covered && <CheckCircle className="w-3 h-3" />}
              {b.label}
            </span>
          ))}
        </div>

        {/* Why this plan fits you */}
        {plan.fitReasons.length > 0 && (
          <div className={`rounded-xl p-3 mb-3 ${isBest ? 'bg-brand-100' : 'bg-gray-50'}`}>
            <p className={`text-xs font-semibold mb-2 ${isBest ? 'text-brand-700' : 'text-gray-500'}`}>
              Why this plan fits you
            </p>
            <div className="flex flex-wrap gap-1.5">
              {plan.fitReasons.map((r, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${
                  isBest ? 'bg-brand-500 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Short-term warning */}
        {plan.planType === 'short_term' && (
          <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Short-term plans have serious gaps — no pre-existing condition coverage, no mental health, no maternity. Use only as a temporary bridge.
            </p>
          </div>
        )}

        {/* Expandable details */}
        <button
          onClick={() => setExpanded(e => !e)}
          className={`w-full flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-xl transition-all ${
            isBest ? 'text-brand-700 hover:bg-brand-100' : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide details</> : <><ChevronDown className="w-3.5 h-3.5" /> See plan details</>}
        </button>

        {expanded && (
          <div className={`mt-3 pt-3 border-t space-y-2 ${isBest ? 'border-brand-200' : 'border-gray-100'}`}>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Deductible</span>
                <p className="font-medium text-gray-700">${plan.deductible.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-400">Out-of-pocket max</span>
                <p className="font-medium text-gray-700">${plan.oopMax.toLocaleString()}</p>
              </div>
            </div>
            {!plan.isReal && (
              <p className="text-xs text-gray-400 italic">
                This is an estimated plan. Actual plans in your area may vary. Enter your ZIP code for real options.
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {plan.planUrl ? (
            <a
              href={plan.planUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-all"
            >
              Select this plan <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-all">
              Select this plan
            </button>
          )}
          <button
            onClick={() => setSaved(s => !s)}
            className={`p-2.5 rounded-xl border transition-all ${
              saved ? 'border-brand-300 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-brand-500' : ''}`} />
          </button>
          <button className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:border-gray-300 transition-all">
            <GitCompare className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PlanCards({ plans, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
            <div className="h-16 bg-gray-100 rounded mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 bg-gray-100 rounded" />
              <div className="h-12 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">No plans found.</p>
        <p className="text-xs mt-1">Try adding your ZIP code for real plans in your area.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {plans.map((plan, i) => (
        <PlanCardItem key={plan.id} plan={plan} isBest={i === 0} />
      ))}
    </div>
  )
}
