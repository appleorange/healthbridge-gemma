'use client'
import { useState } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'

interface Term {
  term: string
  definition: string
  category: string
}

const TERMS: Term[] = [
  { term: 'Premium', category: 'Cost basics', definition: 'The amount you pay every month for health insurance, whether or not you use any medical services. Think of it as a subscription fee.' },
  { term: 'Deductible', category: 'Cost basics', definition: 'The amount you pay out-of-pocket for covered services before your insurance starts paying. For example, if your deductible is $1,500, you pay the first $1,500 of covered medical expenses each year.' },
  { term: 'Copay', category: 'Cost basics', definition: 'A fixed dollar amount you pay for a covered healthcare service. For example, $25 each time you visit your primary care doctor, regardless of the total cost of the visit.' },
  { term: 'Coinsurance', category: 'Cost basics', definition: 'Your share of the cost of a covered service after you\'ve paid your deductible, expressed as a percentage. If your coinsurance is 20%, you pay 20% and your plan pays 80%.' },
  { term: 'Out-of-pocket maximum', category: 'Cost basics', definition: 'The most you\'ll have to pay for covered services in a plan year. After you reach this amount, your insurance pays 100% for the rest of the year. Premiums don\'t count toward this limit.' },
  { term: 'HMO (Health Maintenance Organization)', category: 'Plan types', definition: 'A plan that limits coverage to care from doctors in the plan\'s network. Requires a referral to see a specialist. Generally lower premiums but less flexibility.' },
  { term: 'PPO (Preferred Provider Organization)', category: 'Plan types', definition: 'A plan that pays more if you use doctors in its network but still covers out-of-network care at a higher cost. No referral needed to see specialists. More flexible but generally higher premiums.' },
  { term: 'EPO (Exclusive Provider Organization)', category: 'Plan types', definition: 'A plan that covers care only within its network (except emergencies), but unlike an HMO, doesn\'t require referrals to see specialists.' },
  { term: 'HDHP (High Deductible Health Plan)', category: 'Plan types', definition: 'A plan with lower monthly premiums but higher deductibles. Often paired with a Health Savings Account (HSA). Best for healthy people who don\'t expect many medical expenses.' },
  { term: 'HSA (Health Savings Account)', category: 'Accounts', definition: 'A tax-advantaged savings account paired with an HDHP. You can contribute pre-tax money to pay for qualified medical expenses. Unused funds roll over year to year.' },
  { term: 'FSA (Flexible Spending Account)', category: 'Accounts', definition: 'A tax-advantaged account to pay for eligible medical expenses. Unlike HSAs, FSAs are use-it-or-lose-it — funds typically expire at the end of the year.' },
  { term: 'Network', category: 'Coverage', definition: 'The group of doctors, hospitals, and other healthcare providers that have contracts with your health plan. Using in-network providers costs less than going out-of-network.' },
  { term: 'Prior authorization', category: 'Coverage', definition: 'Approval you must get from your insurance plan before a specific medical service, procedure, or prescription will be covered. Skipping this step can result in a denied claim.' },
  { term: 'Explanation of Benefits (EOB)', category: 'Coverage', definition: 'A statement from your insurance company showing what was billed, what the plan paid, and what you owe after a medical service. Not a bill — an explanation.' },
  { term: 'Open enrollment', category: 'Enrollment', definition: 'The annual period when you can sign up for or change your health insurance plan. For ACA marketplace plans, this is typically November 1 – January 15 each year.' },
  { term: 'Special Enrollment Period (SEP)', category: 'Enrollment', definition: 'A time outside the open enrollment period when you can enroll in or change health insurance due to a qualifying life event (job loss, marriage, birth of a child, moving, etc.).' },
  { term: 'Qualifying Life Event (QLE)', category: 'Enrollment', definition: 'A major change in your life that triggers a Special Enrollment Period. Examples: getting married, having a baby, losing job-based coverage, moving to a new state.' },
  { term: 'COBRA', category: 'Enrollment', definition: 'A federal law allowing you to keep your employer\'s health coverage for up to 18 months after losing job-based insurance. You pay the full premium (employer\'s share + yours) plus a 2% admin fee.' },
  { term: 'Premium Tax Credit (PTC)', category: 'Subsidies', definition: 'A federal subsidy to help people with moderate incomes pay for ACA marketplace health insurance. The amount depends on your income and the cost of plans in your area.' },
  { term: 'Cost-Sharing Reduction (CSR)', category: 'Subsidies', definition: 'A discount that lowers how much you pay for deductibles, copayments, and coinsurance. Only available with Silver plans on the ACA marketplace for people with incomes up to 250% FPL.' },
  { term: 'Federal Poverty Level (FPL)', category: 'Subsidies', definition: 'A measure of income set annually by the federal government and used to determine eligibility for various assistance programs including Medicaid and ACA subsidies.' },
  { term: 'Medicaid', category: 'Programs', definition: 'A joint federal and state program providing free or very low-cost health coverage to eligible low-income individuals and families. Eligibility and benefits vary by state.' },
  { term: 'CHIP (Children\'s Health Insurance Program)', category: 'Programs', definition: 'A program providing low-cost health coverage to children in families that earn too much to qualify for Medicaid but can\'t afford private insurance. Some states also cover pregnant women.' },
  { term: 'Medicare', category: 'Programs', definition: 'Federal health insurance for people 65 and older, and for some younger people with disabilities. Has multiple parts: A (hospital), B (medical), C (Medicare Advantage), D (prescriptions).' },
  { term: 'Metal tier', category: 'ACA plans', definition: 'A categorization system for ACA marketplace plans. Bronze plans have the lowest premiums but highest costs when you use care. Silver, Gold, and Platinum tiers have progressively higher premiums but lower cost-sharing.' },
  { term: 'Formulary', category: 'Prescriptions', definition: 'A list of prescription drugs covered by your health plan, divided into tiers that determine your copay or coinsurance for each drug. Your drug may not be on a plan\'s formulary.' },
  { term: 'In-network vs. out-of-network', category: 'Coverage', definition: 'In-network providers have negotiated rates with your insurer, so your costs are lower. Out-of-network providers charge full rates; your plan may cover none, or less, of the cost.' },
  { term: 'Referral', category: 'Coverage', definition: 'A written order from your primary care doctor to see a specialist. Required by most HMO plans. Without a referral, the specialist visit may not be covered.' },
  { term: 'Claim', category: 'Coverage', definition: 'A request you or your healthcare provider submits to your health insurance company for payment of services provided. The insurer then approves, partially pays, or denies the claim.' },
  { term: 'Denial', category: 'Appeals', definition: 'When your insurer refuses to pay for a service, referral, or prescription. Common reasons include prior authorization issues, out-of-network care, or lack of medical necessity. Denials can be appealed.' },
  { term: 'Internal appeal', category: 'Appeals', definition: 'A formal request to your insurance company to review and overturn a denied claim. You have at least 180 days from the denial date to file. The plan must respond within 30–60 days.' },
  { term: 'External review', category: 'Appeals', definition: 'If your internal appeal is denied, you can request an independent external review by a non-insurance organization. This is free under the ACA and the decision is binding on the insurer.' },
]

const CATEGORIES = Array.from(new Set(TERMS.map(t => t.category)))

export default function GlossarySearch() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)

  const filtered = TERMS.filter(t => {
    const matchesQuery = !query || t.term.toLowerCase().includes(query.toLowerCase()) || t.definition.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = !selectedCategory || t.category === selectedCategory
    return matchesQuery && matchesCategory
  })

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search terms (e.g. deductible, copay, COBRA)…"
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-brand-400"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
            !selectedCategory ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              selectedCategory === cat ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400">{filtered.length} term{filtered.length !== 1 ? 's' : ''}</p>

      <div className="space-y-1.5">
        {filtered.map(t => {
          const isExpanded = expandedTerm === t.term
          return (
            <div key={t.term} className="rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpandedTerm(isExpanded ? null : t.term)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-all"
              >
                <div>
                  <span className="text-sm font-semibold text-gray-800">{t.term}</span>
                  <span className="ml-2 text-xs text-gray-400">{t.category}</span>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-50">
                  <p className="text-sm text-gray-600 leading-relaxed mt-3">{t.definition}</p>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No terms match your search.</p>
        )}
      </div>
    </div>
  )
}
