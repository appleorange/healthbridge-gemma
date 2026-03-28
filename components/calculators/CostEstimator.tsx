'use client'
import { useState, useMemo } from 'react'
import { TrendingDown, Info, ChevronRight, Sparkles, FileText } from 'lucide-react'
import { estimateCosts, calculateSubsidy } from '@/lib/calculators/cost-estimator'
import type { UserProfile, PlanType, CostEstimate, ParsedDocument } from '@/types'

function formatRange(low: number, high: number, prefix = '$', suffix = ''): string {
  if (low === high) return `${prefix}${low.toLocaleString()}${suffix}`
  return `${prefix}${low.toLocaleString()}–${high.toLocaleString()}${suffix}`
}

interface Props {
  profile: UserProfile
  eligiblePlans: PlanType[]
  primaryRecommendation?: PlanType
  onSeeFullPlans?: () => void
  documentPlans?: ParsedDocument[]
}

// ── Receipt line component ────────────────────────────────────────────────────

function ReceiptLine({
  label, value, color, bold, indent, divider,
}: {
  label: string; value: string; color?: 'green'
  bold?: boolean; indent?: boolean; divider?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${divider ? 'pt-2 mt-1 border-t border-gray-200' : ''}`}>
      <span className={[
        'flex items-center gap-1',
        indent ? 'pl-4 text-xs text-gray-500' : bold ? 'text-sm font-semibold text-gray-900' : 'text-sm text-gray-600',
      ].join(' ')}>
        {indent && <span className="text-gray-300">·</span>}
        {label}
      </span>
      <span className={[
        'tabular-nums',
        indent ? 'text-xs font-medium text-gray-600' : bold ? 'text-sm font-bold text-gray-900' : 'text-sm font-medium text-gray-700',
        color === 'green' ? 'text-green-600' : '',
      ].join(' ')}>
        {value}
      </span>
    </div>
  )
}

// ── What-if live calculator ───────────────────────────────────────────────────

function computeWhatIfAnnual(
  tier: 'Bronze' | 'Silver' | 'Gold',
  visitsPerYear: number,
  rxPerMonth: number,
  subsidy: ReturnType<typeof calculateSubsidy>
): number {
  const grossPremium = { Bronze: 280, Silver: 420, Gold: 580 }[tier]
  const credit = subsidy.qualifiesForPTC
    ? (subsidy.estimatedMonthlyCredit.low + subsidy.estimatedMonthlyCredit.high) / 2
    : 0
  const netMonthly = Math.max(0, grossPremium - credit)
  const copay = { Bronze: 70, Silver: 40, Gold: 20 }[tier]
  const rxCostPerFill = { Bronze: 50, Silver: 25, Gold: 15 }[tier]
  const oopMax = { Bronze: 9000, Silver: 6000, Gold: 3500 }[tier]
  const oop = Math.min(visitsPerYear * copay + rxPerMonth * rxCostPerFill * 12, oopMax)
  return Math.round(netMonthly * 12 + oop)
}

// ── Tier rationale text ───────────────────────────────────────────────────────

function getTierRationale(
  profile: UserProfile,
  primaryRecommendation: PlanType | undefined,
  tierLabel: string,
  numRx: number,
  estimates: CostEstimate[]
): string | null {
  if (primaryRecommendation !== 'aca_marketplace') return null
  const usage = profile.expectedHealthcareUsage
  const rxText = numRx > 0
    ? ` With ${numRx} regular prescription${numRx !== 1 ? 's' : ''},`
    : ''

  if (usage === 'minimal') {
    return `With minimal healthcare needs, a Bronze plan means you pay less every month — typically $100–200 less than a Silver or Gold plan. You'd only hit the higher deductible if something unexpected happens, which statistically costs less than overpaying on premiums all year.`
  }
  if (usage === 'high') {
    return `With frequent care needs, a Gold plan's higher premium is offset by much lower costs each time you use it.${rxText} the lower copays and deductible of Gold plans typically save money over Bronze or Silver when you're regularly using your insurance.`
  }
  // moderate / default → Silver
  const bronzeEst = estimates.find(e => e.planLabel?.includes('Bronze'))
  const silverEst = estimates.find(e => e.planLabel?.includes('Silver') || e.planType === 'aca_marketplace')
  if (bronzeEst && silverEst) {
    const deductibleDiff = 6000 - 1500 // Bronze vs Silver typical
    return `A Silver plan balances your monthly cost against what you'd pay when you actually need care.${rxText} Silver's deductible ($1,500 vs Bronze's $6,000) means you reach coverage $${deductibleDiff.toLocaleString()} sooner, without paying Gold-level premiums every month.`
  }
  return `A Silver plan balances your monthly cost against what you'd pay when you actually need care.${rxText} Silver's lower deductible compared to Bronze means you reach coverage sooner, without paying Gold-level premiums every month.`
}

// ── Main component ────────────────────────────────────────────────────────────

const HOSP_VISITS: Record<string, number> = {
  never: 0, '1_to_2_per_year': 2, monthly: 12, regularly: 20,
}

const COPAY_BY_TYPE: Partial<Record<PlanType, number>> = {
  aca_marketplace: 35, medicaid: 3, school_plan: 20, employer_sponsored: 25,
  international_student_plan: 30, cobra: 25, short_term: 60,
}

const RX_MULT_BY_TYPE: Partial<Record<PlanType, number>> = {
  aca_marketplace: 0.3, medicaid: 0.05, school_plan: 0.2, employer_sponsored: 0.2,
  international_student_plan: 0.3, cobra: 0.25, short_term: 1.0,
}

export default function CostEstimator({ profile, eligiblePlans, primaryRecommendation, onSeeFullPlans, documentPlans }: Props) {
  const numRx = profile.numberOfPrescriptions ?? (profile.takesRegularMedications ? 2 : 0)

  const [visitsPerYear, setVisitsPerYear] = useState(
    HOSP_VISITS[profile.hospitalVisitFrequency ?? ''] ?? 3
  )
  const [rxPerMonth, setRxPerMonth] = useState(numRx)

  const estimates = useMemo(() => estimateCosts(profile, eligiblePlans), [profile, eligiblePlans])
  const subsidy = useMemo(() => calculateSubsidy(profile), [profile])

  const primaryEst: CostEstimate | undefined = useMemo(() => {
    if (!primaryRecommendation) return estimates[0]
    return estimates.find(e => e.planType === primaryRecommendation) ?? estimates[0]
  }, [estimates, primaryRecommendation])

  const isACARecommended = primaryRecommendation === 'aca_marketplace'
  const isACAEligible = eligiblePlans.includes('aca_marketplace')

  // Receipt breakdown data
  const creditPerMonth = Math.round((primaryEst?.subsidyApplied ?? 0) / 12)
  const grossMonthlyLow = (primaryEst?.estimatedMonthlyPremium.low ?? 0) + creditPerMonth
  const grossMonthlyHigh = (primaryEst?.estimatedMonthlyPremium.high ?? 0) + creditPerMonth
  const copayEst = COPAY_BY_TYPE[primaryEst?.planType ?? 'aca_marketplace'] ?? 35
  const rxMult = RX_MULT_BY_TYPE[primaryEst?.planType ?? 'aca_marketplace'] ?? 0.3
  const visitsCostAnnual = Math.round(visitsPerYear * copayEst)
  const rxCostAnnual = Math.round(numRx * 30 * rxMult * 12)
  const baseOop = primaryEst?.estimatedAnnualOutOfPocket.low ?? 0
  const otherCostAnnual = Math.max(0, baseOop - visitsCostAnnual - rxCostAnnual)

  const tierLabel = primaryEst?.planLabel?.includes('Bronze') ? 'Bronze'
    : primaryEst?.planLabel?.includes('Gold') ? 'Gold' : 'Silver'

  const tierRationale = getTierRationale(profile, primaryRecommendation, tierLabel, numRx, estimates)

  // What-if live costs
  const liveCosts = useMemo(() => ({
    bronze: computeWhatIfAnnual('Bronze', visitsPerYear, rxPerMonth, subsidy),
    silver: computeWhatIfAnnual('Silver', visitsPerYear, rxPerMonth, subsidy),
    gold:   computeWhatIfAnnual('Gold',   visitsPerYear, rxPerMonth, subsidy),
  }), [visitsPerYear, rxPerMonth, subsidy])
  const maxLive = Math.max(liveCosts.bronze, liveCosts.silver, liveCosts.gold, 1)

  // Subsidy math
  const fpl = subsidy.fplPercentage
  const requiredContribPct = fpl < 150 ? 0 : fpl < 200 ? 3.0 : fpl < 250 ? 4.0 : fpl < 300 ? 6.0 : 8.5
  const requiredMonthly = Math.round(profile.annualIncome * requiredContribPct / 100 / 12)

  // Compare plans: primary vs next-cheapest different type
  const compareSecond = estimates.find(e => e.planType !== primaryEst?.planType)

  return (
    <div className="space-y-6">

      {/* Profile context chips */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Based on your health profile</p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full capitalize">
            {profile.expectedHealthcareUsage ?? 'moderate'} usage
          </span>
          {numRx > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
              {numRx} prescription{numRx !== 1 ? 's' : ''}
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
      </div>

      {/* ── SECTION 1: Cost Breakdown Receipt ── */}
      {primaryEst && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-brand-800">Your cost breakdown</p>
            <span className="ml-auto text-xs text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full whitespace-nowrap">
              {primaryEst.planLabel}
            </span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-brand-100 space-y-2">
            {/* Premium */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Monthly premium</p>
            {creditPerMonth > 0 && grossMonthlyLow > 0 && (
              <ReceiptLine label="Gross premium" value={`$${grossMonthlyLow}–$${grossMonthlyHigh}/mo`} />
            )}
            {creditPerMonth > 0 && (
              <ReceiptLine label="− Premium Tax Credit" value={`−$${creditPerMonth}/mo`} color="green" />
            )}
            <ReceiptLine
              label={creditPerMonth > 0 ? 'Your net monthly premium' : 'Monthly premium'}
              value={`${formatRange(primaryEst.estimatedMonthlyPremium.low, primaryEst.estimatedMonthlyPremium.high)}/mo`}
              bold
              divider={creditPerMonth > 0}
            />
            <ReceiptLine
              label="Annual premiums"
              value={`${formatRange(primaryEst.estimatedMonthlyPremium.low * 12, primaryEst.estimatedMonthlyPremium.high * 12)}/yr`}
              indent
            />

            {/* OOP */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Estimated out-of-pocket</p>
              {visitsCostAnnual > 0 ? (
                <ReceiptLine
                  label={`Doctor visits (${visitsPerYear}/yr × $${copayEst} copay)`}
                  value={`$${visitsCostAnnual.toLocaleString()}/yr`}
                  indent
                />
              ) : (
                <ReceiptLine label="Doctor visits" value="~$0 (no visits expected)" indent />
              )}
              {rxCostAnnual > 0 && (
                <ReceiptLine
                  label={`Prescriptions (${numRx} Rx × 12 mo)`}
                  value={`$${rxCostAnnual.toLocaleString()}/yr`}
                  indent
                />
              )}
              {profile.expectsSurgeryOrProcedure && (
                <ReceiptLine label="Planned procedure (est.)" value="$3,000–5,000" indent />
              )}
              {otherCostAnnual > 0 && (
                <ReceiptLine label="Other care / copays" value={`$${otherCostAnnual.toLocaleString()}/yr`} indent />
              )}
            </div>

            {/* Total */}
            <ReceiptLine
              label="ESTIMATED ANNUAL TOTAL"
              value={formatRange(primaryEst.estimatedAnnualTotal.low, primaryEst.estimatedAnnualTotal.high)}
              bold
              divider
            />
          </div>
          <p className="text-xs text-brand-600 mt-2">
            Estimates are ranges. Actual costs depend on your specific plan, providers, and utilization.
          </p>
        </div>
      )}

      {/* ── SECTION 2: Why this plan tier ── */}
      {tierRationale && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Why {tierLabel} makes sense for you
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{tierRationale}</p>
        </div>
      )}

      {/* ── SECTION 3: What-if calculator (ACA only) ── */}
      {isACARecommended && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">What-if calculator</p>

          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Doctor visits per year</label>
                <span className="text-sm font-semibold text-brand-700 tabular-nums">{visitsPerYear}</span>
              </div>
              <input
                type="range" min={0} max={24} step={1}
                value={visitsPerYear}
                onChange={e => setVisitsPerYear(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5 select-none">
                <span>0</span><span>12</span><span>24</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Prescription fills per month</label>
                <span className="text-sm font-semibold text-brand-700 tabular-nums">{rxPerMonth}</span>
              </div>
              <input
                type="range" min={0} max={10} step={1}
                value={rxPerMonth}
                onChange={e => setRxPerMonth(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5 select-none">
                <span>0</span><span>5</span><span>10</span>
              </div>
            </div>
          </div>

          {/* Live bar chart */}
          <div className="space-y-2.5">
            <p className="text-xs text-gray-400 font-medium">Estimated annual total by metal tier</p>
            {([
              { label: 'Bronze', bar: 'bg-amber-400',  value: liveCosts.bronze },
              { label: 'Silver', bar: 'bg-gray-400',   value: liveCosts.silver },
              { label: 'Gold',   bar: 'bg-yellow-400', value: liveCosts.gold   },
            ] as const).map(({ label, bar, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-600 w-12 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${bar} transition-all duration-200 ease-out`}
                    style={{ width: `${Math.max(4, (value / maxLive) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-16 text-right tabular-nums flex-shrink-0">
                  ${value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            {subsidy.qualifiesForPTC
              ? `Premium Tax Credit of ~$${Math.round((subsidy.estimatedMonthlyCredit.low + subsidy.estimatedMonthlyCredit.high) / 2)}/mo is applied to all three tiers above.`
              : 'Move the sliders to see how your care usage changes the annual cost across tiers.'}
          </p>
        </div>
      )}

      {/* ── SECTION 4: Subsidy explained ── */}
      {isACAEligible && subsidy.qualifiesForPTC && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-green-800">Subsidy explained</p>
          </div>

          <div className="bg-white rounded-xl p-3 border border-green-100 text-center">
            <p className="text-3xl font-bold text-green-700 tabular-nums">{subsidy.fplPercentage}%</p>
            <p className="text-xs text-green-600 mt-0.5">of the federal poverty level</p>
          </div>

          <div className="bg-white rounded-xl p-3 border border-green-100 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-gray-600">
              <span>Your income × {requiredContribPct}% ÷ 12</span>
              <span className="font-semibold text-gray-800">${requiredMonthly}/mo cap</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Benchmark Silver plan (national avg)</span>
              <span className="font-semibold text-gray-800">~$450–600/mo</span>
            </div>
            <div className="border-t border-green-200 pt-2 flex justify-between text-green-700">
              <span>Your estimated credit</span>
              <span className="font-bold">
                ~${subsidy.estimatedMonthlyCredit.low}–${subsidy.estimatedMonthlyCredit.high}/mo
              </span>
            </div>
          </div>

          <p className="text-xs text-green-800 leading-relaxed">
            At <strong>{subsidy.fplPercentage}% FPL</strong>, the government caps your required contribution at{' '}
            <strong>{requiredContribPct}% of your income</strong> (${requiredMonthly}/mo).
            The benchmark Silver plan costs more than that in your area, so the credit covers the difference.
          </p>

          {subsidy.qualifiesForCSR && (
            <div className="bg-white rounded-xl p-3 border border-green-100">
              <p className="text-xs font-semibold text-green-700 mb-1.5">
                Cost-Sharing Reduction (CSR) — bonus for Silver plans
              </p>
              <p className="text-xs text-green-700 leading-relaxed">
                Because you're under 250% FPL, choosing a <strong>Silver plan</strong> also reduces your deductible
                from the standard $1,500–3,000 down to{' '}
                <strong>
                  {subsidy.csrLevel === 'silver_94' ? '$75–300'
                    : subsidy.csrLevel === 'silver_87' ? '$300–800'
                    : '$800–1,400'}
                </strong>.
                This is only available on Silver plans — choosing Bronze or Gold loses this benefit entirely.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Subsidy ineligible notes */}
      {!subsidy.qualifiesForPTC && !subsidy.medicaidEligible && subsidy.notes.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-800">About subsidy eligibility</p>
          </div>
          {subsidy.notes.map((note, i) => (
            <p key={i} className="text-sm text-amber-700 leading-relaxed">{note}</p>
          ))}
        </div>
      )}

      {/* Medicaid banner */}
      {subsidy.medicaidEligible && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800 mb-1">Medicaid eligible</p>
          <p className="text-sm text-green-700">
            At your income level you likely qualify for Medicaid — $0 premium, minimal cost-sharing.
            Apply at your state Medicaid office or Healthcare.gov before exploring other options.
          </p>
        </div>
      )}

      {/* ── DOCUMENT PLANS: Actual numbers from uploaded docs ── */}
      {documentPlans && documentPlans.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-blue-800">Actual plan numbers from your documents</p>
          </div>
          <p className="text-xs text-blue-700">
            These are real figures extracted from documents you uploaded — compare them against the estimates above.
          </p>
          <div className="space-y-3">
            {documentPlans.map(doc => {
              const d = doc.planDetails
              if (!d || !Object.values(d).some(v => v)) return null
              return (
                <div key={doc.id} className="bg-white rounded-xl p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-gray-700 mb-2 truncate">{doc.fileName}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['Monthly premium', d.premium],
                      ['Deductible', d.deductible],
                      ['Out-of-pocket max', d.outOfPocketMax],
                      ['Network type', d.networkType],
                      ['Coinsurance', d.coinsurance],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label as string}>
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-sm font-semibold text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>
                  {d.copays && Object.keys(d.copays).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-blue-50">
                      <p className="text-xs text-gray-400 mb-1">Copays</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(d.copays).map(([k, v]) => (
                          <span key={k} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 5: Compare two plans ── */}
      {primaryEst && compareSecond && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Compare your top two options
          </p>
          <div className="grid grid-cols-2 gap-3">
            {([primaryEst, compareSecond] as const).map((est, i) => (
              <div
                key={est.planLabel}
                className={`rounded-xl p-3 ${i === 0 ? 'bg-brand-50 border border-brand-200' : 'bg-gray-50 border border-gray-200'}`}
              >
                <p className={`text-xs font-semibold mb-2 leading-snug ${i === 0 ? 'text-brand-700' : 'text-gray-600'}`}>
                  {est.planLabel}
                  {i === 0 && <span className="block text-brand-500 font-medium mt-0.5">★ AI recommended</span>}
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Monthly</span>
                    <span className={`font-medium tabular-nums ${i === 0 ? 'text-brand-800' : 'text-gray-800'}`}>
                      {formatRange(est.estimatedMonthlyPremium.low, est.estimatedMonthlyPremium.high)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">OOP est.</span>
                    <span className={`font-medium tabular-nums ${i === 0 ? 'text-brand-800' : 'text-gray-800'}`}>
                      {formatRange(est.estimatedAnnualOutOfPocket.low, est.estimatedAnnualOutOfPocket.high)}
                    </span>
                  </div>
                  <div className={`flex justify-between gap-2 pt-1.5 border-t ${i === 0 ? 'border-brand-200' : 'border-gray-200'}`}>
                    <span className="font-semibold text-gray-700">Annual</span>
                    <span className={`font-bold tabular-nums ${i === 0 ? 'text-brand-700' : 'text-gray-700'}`}>
                      {formatRange(est.estimatedAnnualTotal.low, est.estimatedAnnualTotal.high)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* One-line verdict */}
          {(() => {
            const diff = compareSecond.estimatedAnnualTotal.low - primaryEst.estimatedAnnualTotal.low
            const diffAbs = Math.abs(diff)
            if (diffAbs < 300) {
              return (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  These two options cost roughly the same — choose based on coverage needs.
                </p>
              )
            }
            const cheaper = diff > 0 ? primaryEst : compareSecond
            const pricier = diff > 0 ? compareSecond : primaryEst
            return (
              <p className="text-xs text-gray-600 mt-3 text-center">
                <span className="font-semibold">{cheaper.planLabel}</span> is estimated{' '}
                <span className="text-green-600 font-semibold">${diffAbs.toLocaleString()} less</span>
                {' '}per year than {pricier.planLabel}.
              </p>
            )
          })()}
        </div>
      )}

      {/* ── PART 2: See full plan options CTA ── */}
      {onSeeFullPlans && (
        <button
          onClick={onSeeFullPlans}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-brand-200 bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 transition-all"
        >
          Ready to see specific plans?
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <p className="text-xs text-gray-400 text-center pb-2">
        All estimates are based on your profile. Actual costs depend on plan details and provider choices.
      </p>
    </div>
  )
}
