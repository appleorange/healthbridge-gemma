'use client'
import { useEffect, useState } from 'react'
import { Calendar, AlertCircle, Clock, CheckCircle, Info, Sparkles } from 'lucide-react'
import type { UserProfile, EligibilityResult, TimelineEvent } from '@/types'
import AnimatedList from '@/components/ui/AnimatedList'

const PLAN_READABLE: Partial<Record<string, string>> = {
  aca_marketplace: 'ACA marketplace plan',
  employer_sponsored: 'employer plan',
  medicaid: 'Medicaid',
  school_plan: 'school health plan',
  international_student_plan: 'international student plan',
  cobra: 'COBRA continuation',
  short_term: 'short-term plan',
  medicare: 'Medicare',
  parent_plan: "parent/spouse's plan",
}

function generateEvents(profile: UserProfile, eligibilityResult: EligibilityResult): TimelineEvent[] {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const year = today.getFullYear()
  const primary = eligibilityResult.primaryRecommendation
  const eligible = eligibilityResult.eligiblePlans

  // Open Enrollment window (Nov 1 – Jan 15)
  const oeStart = new Date(`${year}-11-01`)
  const oeEnd = new Date(`${year + 1}-01-15`)
  const inOE = today >= oeStart && today <= oeEnd
  const oeUpcoming = today < oeStart

  const events: TimelineEvent[] = []

  // --- ACA Open Enrollment ---
  // Only show if ACA marketplace is actually in the user's eligible plans
  if (eligible.includes('aca_marketplace')) {
    const isAcaRecommended = primary === 'aca_marketplace'
    events.push({
      id: 'oe',
      title: 'ACA Open Enrollment',
      description: isAcaRecommended
        ? `The AI recommends an ACA marketplace plan — this enrollment window is your primary action item. ${inOE ? 'You are currently in Open Enrollment — act now.' : oeUpcoming ? `Starts November 1, ${year}.` : `Next window opens November 1, ${year}.`}`
        : `ACA marketplace is an eligible backup option for you. The AI recommends ${PLAN_READABLE[primary] ?? primary} as your primary plan. ${inOE ? 'Open Enrollment is currently active.' : oeUpcoming ? `Next Open Enrollment starts November 1, ${year}.` : `Next window opens November 1, ${year}.`}`,
      date: `${year}-11-01`,
      endDate: `${year + 1}-01-15`,
      type: 'open_enrollment',
      status: inOE ? 'active' : 'upcoming',
      urgent: inOE || isAcaRecommended,
      actionLabel: 'Browse plans',
      actionUrl: 'https://www.healthcare.gov',
    })
  }

  // --- Medicaid ---
  // Show only if eligible AND user doesn't already have it
  const alreadyOnMedicaid = profile.currentPlanType === 'medicaid'
  if (eligible.includes('medicaid') && !alreadyOnMedicaid) {
    const isMedicaidPrimary = primary === 'medicaid'
    const primaryLabel = PLAN_READABLE[primary] ?? primary
    events.push({
      id: 'medicaid_year_round',
      title: isMedicaidPrimary ? 'Apply for Medicaid — Recommended for You' : 'Medicaid — Backup Option',
      description: isMedicaidPrimary
        ? 'The AI recommends applying for Medicaid — you can do this right now, no enrollment window needed. Medicaid accepts applications year-round and coverage often starts the same month you apply.'
        : `You may qualify for Medicaid as a backup option — the AI recommends ${primaryLabel} as your primary plan. Medicaid accepts applications year-round with no enrollment window.`,
      date: `${year}-01-01`,
      type: 'medicaid',
      status: isMedicaidPrimary ? 'action_required' : 'upcoming',
      urgent: isMedicaidPrimary,
      actionLabel: 'Apply now',
      actionUrl: 'https://www.healthcare.gov/medicaid-chip/',
    })
  }

  // --- SEP Triggers ---
  const isUnemployed = profile.employmentStatus === 'unemployed_seeking' || profile.employmentStatus === 'unemployed_not_seeking'

  // SEP: Job loss — only show if user is actually unemployed or recently lost coverage
  if (isUnemployed || profile.formerEmployerInsurance === true) {
    const daysLeft = profile.unemployedMonths
      ? Math.max(0, 60 - (profile.unemployedMonths * 30))
      : null
    events.push({
      id: 'sep_job_loss',
      title: 'Special Enrollment Period — loss of coverage',
      description: daysLeft !== null
        ? `You lost employer coverage. You have approximately ${daysLeft} days left to enroll in an ACA marketplace plan without waiting for Open Enrollment. Do not miss this window.`
        : 'Losing employer-sponsored insurance is a qualifying life event. You have 60 days from losing coverage to enroll in a new plan.',
      date: todayStr,
      type: 'sep',
      status: daysLeft !== null && daysLeft < 30 ? 'action_required' : 'active',
      urgent: daysLeft !== null && daysLeft < 30,
      actionLabel: 'Enroll now',
      actionUrl: 'https://www.healthcare.gov/coverage-outside-open-enrollment/special-enrollment-period/',
    })
  }

  // SEP: Marriage/birth/moving — only show if user is stable and has ACA eligibility
  // Do NOT show for unemployed users (they already have a SEP from job loss)
  // Do NOT show for dependents (not relevant)
  // Only show if it adds value — i.e. they are currently insured and ACA is eligible
  if (
    eligible.includes('aca_marketplace') &&
    !isUnemployed &&
    profile.currentPlanType !== 'parent_employer' &&
    profile.currentPlanType !== 'spouse_employer' &&
    profile.currentlyInsured
  ) {
    events.push({
      id: 'sep_other',
      title: 'SEP: Marriage, new baby, or moving states',
      description: 'Getting married, having a baby, or moving to a new state trigger a 60-day Special Enrollment Period. You can enroll in or change your marketplace plan within that window.',
      date: todayStr,
      type: 'sep',
      status: 'upcoming',
      urgent: false,
    })
  }

  // --- COBRA ---
  if (isUnemployed) {
    if (profile.onCOBRA && profile.cobraMonthsRemaining != null) {
      const cobraExpiry = new Date(today)
      cobraExpiry.setMonth(cobraExpiry.getMonth() + profile.cobraMonthsRemaining)
      const daysLeft = Math.round(profile.cobraMonthsRemaining * 30)
      const isUrgent = daysLeft <= 60
      events.push({
        id: 'cobra_expiry',
        title: `COBRA Coverage Ending — ${daysLeft} days remaining`,
        description: `Your COBRA coverage expires in approximately ${profile.cobraMonthsRemaining} month${profile.cobraMonthsRemaining === 1 ? '' : 's'} (${daysLeft} days). ${isUrgent ? 'Start exploring replacement coverage now — ' : 'Plan your transition ahead: '}job loss is a qualifying life event giving you a 60-day SEP on the ACA marketplace.`,
        date: cobraExpiry.toISOString().split('T')[0],
        type: 'cobra',
        status: isUrgent ? 'action_required' : 'upcoming',
        urgent: isUrgent,
        actionLabel: 'Compare ACA plans',
        actionUrl: 'https://www.healthcare.gov',
      })
    } else if (!profile.onCOBRA) {
      const cobraDeadline = new Date(today)
      cobraDeadline.setDate(cobraDeadline.getDate() + 60)
      events.push({
        id: 'cobra_election',
        title: 'COBRA Election Window — 60 days to decide',
        description: 'You have 60 days from losing employer coverage to elect COBRA. The deadline is strict — missing it means you lose the option permanently. COBRA preserves your existing network and doctors but requires you to pay the full premium.',
        date: cobraDeadline.toISOString().split('T')[0],
        type: 'cobra',
        status: 'action_required',
        urgent: true,
        actionLabel: 'Learn about COBRA',
        actionUrl: 'https://www.dol.gov/general/topic/health-plans/cobra',
      })
    }
  }

  // --- Dependent coverage end date ---
  if (profile.dependentCoverageEndDate) {
    const endDate = new Date(profile.dependentCoverageEndDate)
    const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const isUrgent = daysUntilEnd <= 60
    const formattedEnd = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    events.push({
      id: 'dependent_coverage_end',
      title: daysUntilEnd > 0 ? `Current coverage ends in ${daysUntilEnd} days` : 'Current coverage has ended',
      description: `Your current coverage ends on ${formattedEnd}. ${daysUntilEnd > 0 ? `You have ${daysUntilEnd} days to enroll in new coverage.` : 'You no longer have active coverage.'} Loss of dependent coverage is a qualifying life event — it opens a 60-day Special Enrollment Period on the ACA marketplace.`,
      date: profile.dependentCoverageEndDate,
      type: 'sep',
      status: isUrgent || daysUntilEnd <= 0 ? 'action_required' : 'upcoming',
      urgent: isUrgent || daysUntilEnd <= 0,
      actionLabel: 'Find new coverage',
      actionUrl: 'https://www.healthcare.gov/coverage-outside-open-enrollment/special-enrollment-period/',
    })
  }

  // --- University plan deadlines ---
  // Only show if school_plan is actually in the eligible plans for this user
  if ((eligible.includes('school_plan') || ['f1_student', 'j1_scholar', 'j2', 'f1_opt'].includes(profile.immigrationStatus)) &&
      (profile.isStudent || ['f1_student', 'j1_scholar', 'j2', 'f1_opt'].includes(profile.immigrationStatus))) {
    const schoolName = profile.university ?? 'Your university'
    const fallDeadline = new Date(`${year}-09-15`)
    const springDeadline = new Date(`${year + 1}-01-31`)
    const nextFallDeadline = new Date(`${year + 1}-09-15`)
    const isSchoolRecommended = primary === 'school_plan'

    events.push({
      id: 'school_fall',
      title: `${schoolName}: Fall Enrollment / Waiver Deadline`,
      description: isSchoolRecommended
        ? `You need to enroll in or waive ${profile.university ?? 'your school'}'s health plan by this date — the AI recommends the school plan for your situation. Log into your student portal to confirm the exact deadline and complete enrollment.`
        : `${profile.university ? `${profile.university} requires` : 'Most universities require'} insurance enrollment or an approved waiver by mid-September for the fall semester. Log into your student portal to check the exact deadline.`,
      date: (today > fallDeadline ? nextFallDeadline : fallDeadline).toISOString().split('T')[0],
      type: 'university',
      status: isSchoolRecommended ? 'action_required' : 'upcoming',
      urgent: isSchoolRecommended,
    })

    events.push({
      id: 'school_spring',
      title: `${schoolName}: Spring Enrollment / Waiver Deadline`,
      description: `${profile.university ? `${profile.university}'s spring` : 'Spring'} semester insurance deadlines are typically late January. If you're adding or waiving coverage for spring, check your student portal now.`,
      date: springDeadline.toISOString().split('T')[0],
      type: 'university',
      status: 'upcoming',
    })

    if (profile.yearsLeftInCollege === 'less_than_1') {
      const gradDate = new Date(today)
      gradDate.setMonth(gradDate.getMonth() + 8)
      events.push({
        id: 'graduation_transition',
        title: profile.university
          ? `${profile.university} plan ends at graduation — act soon`
          : 'School plan ends at graduation — act soon',
        description: `Your ${profile.university ?? 'school'} health plan terminates when you graduate. Graduation is a qualifying life event — you have 60 days to enroll in new coverage. Start now: compare ACA marketplace plans, ask your next employer about their coverage start date, or look into alumni plans.`,
        date: gradDate.toISOString().split('T')[0],
        type: 'action',
        status: 'action_required',
        urgent: true,
      })
    }
  }

  // --- Employer open enrollment ---
  if (profile.employerName && profile.employerOpenEnrollmentMonth && profile.employerOpenEnrollmentMonth !== 'unknown') {
    const MONTH_INDEX: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    }
    const monthIdx = MONTH_INDEX[profile.employerOpenEnrollmentMonth]
    if (monthIdx !== undefined) {
      let oeYear = year
      if (new Date(year, monthIdx, 1) < today) oeYear = year + 1
      const oeDate = new Date(oeYear, monthIdx, 1)
      const monthLabel = profile.employerOpenEnrollmentMonth.charAt(0).toUpperCase() + profile.employerOpenEnrollmentMonth.slice(1)
      const daysAway = Math.ceil((oeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const isEmployerRecommended = primary === 'employer_sponsored'
      events.push({
        id: 'employer_oe',
        title: `${profile.employerName} Open Enrollment: ${monthLabel} ${oeYear}`,
        description: isEmployerRecommended
          ? `The AI recommends your employer plan — make sure you're enrolled during ${profile.employerName}'s open enrollment in ${monthLabel}. ${daysAway > 0 ? `${daysAway} days away.` : 'This is happening now.'} Outside of this window or a qualifying life event, you generally cannot switch plans.`
          : `${profile.employerName}'s annual open enrollment window opens in ${monthLabel}${daysAway > 0 ? ` — ${daysAway} days away` : ''}. Review plan options and make any changes during this window. Outside of open enrollment or a qualifying life event, you generally cannot switch employer plans.`,
        date: oeDate.toISOString().split('T')[0],
        type: 'open_enrollment',
        status: daysAway <= 30 ? 'active' : 'upcoming',
        urgent: daysAway <= 30 || isEmployerRecommended,
      })
    }
  }

  // --- Job search timeline ---
  if (profile.jobSearchTimeline && isUnemployed) {
    const TIMELINE_MAP: Record<string, { label: string; months: number }> = {
      less_than_3mo: { label: 'within the next 3 months', months: 3 },
      '3_to_6mo':   { label: 'within 3–6 months',        months: 5 },
      over_6mo:     { label: 'in 6+ months',              months: 9 },
    }
    const tl = TIMELINE_MAP[profile.jobSearchTimeline]
    if (tl) {
      const expectedDate = new Date(today)
      expectedDate.setMonth(expectedDate.getMonth() + tl.months)
      events.push({
        id: 'new_employer_coverage',
        title: `Expected employer coverage: ${tl.label}`,
        description: `Based on your job search timeline, you may gain employer-sponsored insurance ${tl.label}. New employees typically have 30 days from their hire date to enroll. Until then, bridge coverage — COBRA, ACA marketplace, or a short-term plan — may be needed to avoid a gap.`,
        date: expectedDate.toISOString().split('T')[0],
        type: 'action',
        status: 'upcoming',
        urgent: false,
      })
    }
  }

  // --- Aging off parent plan ---
  if (
    profile.currentPlanType === 'parent_employer' &&
    profile.agingOffDate &&
    profile.agingOffDate !== 'over_2_years' &&
    profile.agingOffDate !== 'unknown'
  ) {
    if (profile.agingOffDate === 'already_aged_off') {
      events.push({
        id: 'aging_off',
        title: "You've aged off (or are aging off) your parent's plan — act immediately",
        description: "You have aged off or are about to age off your parent's plan. This triggers a 60-day Special Enrollment Period — act immediately to avoid a gap in coverage. Losing dependent coverage qualifies you to enroll in an ACA marketplace plan, your own employer plan, or Medicaid outside of Open Enrollment.",
        date: todayStr,
        type: 'sep',
        status: 'action_required',
        urgent: true,
        actionLabel: 'Find a plan now',
        actionUrl: 'https://www.healthcare.gov',
      })
    } else if (profile.agingOffDate === 'under_1_year') {
      const transitionDate = new Date(today)
      transitionDate.setMonth(transitionDate.getMonth() + 6)
      events.push({
        id: 'aging_off',
        title: "Aging off parent's plan — under 1 year away",
        description: "You're approaching the age 26 cutoff for your parent's plan. Losing dependent coverage is a qualifying life event — you'll have 60 days to enroll in a new plan. Start comparing options now so you're not caught off guard when the transition arrives.",
        date: transitionDate.toISOString().split('T')[0],
        type: 'action',
        status: 'action_required',
        urgent: true,
        actionLabel: 'Compare plans',
        actionUrl: 'https://www.healthcare.gov',
      })
    } else if (profile.agingOffDate === '1_to_2_years') {
      const transitionDate = new Date(today)
      transitionDate.setMonth(transitionDate.getMonth() + 12)
      events.push({
        id: 'aging_off',
        title: "Aging off parent's plan — 1–2 years away",
        description: "You have 1–2 years before aging off your parent's plan at 26. Start researching your options now so you're ready when the time comes. Employer plans, ACA marketplace, and Medicaid are the most common paths after aging off.",
        date: transitionDate.toISOString().split('T')[0],
        type: 'action',
        status: 'upcoming',
        urgent: false,
        actionLabel: 'Start comparing',
        actionUrl: 'https://www.healthcare.gov',
      })
    }
  }

  // --- J-1 mandatory insurance ---
  if (profile.immigrationStatus === 'j1_scholar') {
    events.push({
      id: 'j1_mandate',
      title: 'J-1 Insurance Requirement (Ongoing)',
      description: 'Federal law (22 CFR 62.14) requires J-1 scholars to maintain insurance meeting minimum standards: $100,000 per accident/illness, $25,000 for medical evacuation, $50,000 for repatriation. Verify your plan meets these thresholds.',
      date: todayStr,
      type: 'action',
      status: 'ongoing',
      urgent: false,
    })
  }

  // Boost urgency of events related to the primary recommendation
  events.forEach(event => {
    const isPrimaryRelated =
      (primary === 'aca_marketplace' && (event.id === 'oe' || event.id.startsWith('sep'))) ||
      (primary === 'medicaid' && event.id === 'medicaid_year_round') ||
      (primary === 'employer_sponsored' && event.id === 'employer_oe') ||
      (primary === 'school_plan' && event.id.startsWith('school_')) ||
      (primary === 'parent_plan' && event.id === 'aging_off') ||
      (primary === 'cobra' && event.id === 'cobra_election')

    if (isPrimaryRelated && event.status === 'upcoming') {
      event.status = 'active'
    }
  })

  return sortEvents(events)
}

function sortEvents(events: TimelineEvent[]): TimelineEvent[] {
  const statusOrder = { action_required: 0, active: 1, ongoing: 2, upcoming: 3, past: 4 }
  return [...events].sort((a, b) => {
    const sa = statusOrder[a.status] ?? 3
    const sb = statusOrder[b.status] ?? 3
    if (sa !== sb) return sa - sb
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
}

function mergeEvents(staticEvents: TimelineEvent[], aiEvents: TimelineEvent[]): TimelineEvent[] {
  // For each type that AI provides, replace all static events of that type
  const aiTypes = new Set(aiEvents.map(e => e.type))
  const filtered = staticEvents.filter(e => !aiTypes.has(e.type))
  return sortEvents([...filtered, ...aiEvents])
}

const TYPE_CONFIG = {
  open_enrollment: { color: 'brand', icon: Calendar },
  sep:             { color: 'blue',  icon: AlertCircle },
  cobra:           { color: 'red',   icon: Clock },
  university:      { color: 'purple', icon: Calendar },
  medicaid:        { color: 'brand', icon: CheckCircle },
  action:          { color: 'amber', icon: Info },
}

const STATUS_BADGE: Record<string, string> = {
  active:          'bg-brand-100 text-brand-700',
  ongoing:         'bg-blue-100 text-blue-700',
  upcoming:        'bg-gray-100 text-gray-600',
  action_required: 'bg-red-100 text-red-700',
  past:            'bg-gray-50 text-gray-400',
}

const STATUS_LABEL: Record<string, string> = {
  active:          'Active now',
  ongoing:         'Year-round',
  upcoming:        'Upcoming',
  action_required: 'Action required',
  past:            'Past',
}

function formatDate(dateStr: string, endDate?: string): string {
  const d = new Date(dateStr)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  const start = d.toLocaleDateString('en-US', opts)
  if (!endDate) return start
  const end = new Date(endDate).toLocaleDateString('en-US', opts)
  return `${start} – ${end}`
}

export interface DocDeadline {
  label: string
  date: string
  urgent: boolean
  fileName: string
}

interface Props {
  profile: UserProfile
  eligibilityResult: EligibilityResult
  docDeadlines?: DocDeadline[]
}

export default function EnrollmentTimeline({ profile, eligibilityResult, docDeadlines }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>(() => generateEvents(profile, eligibilityResult))
  const [aiLoading, setAiLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setAiLoading(true)

    fetch('/api/timeline/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, eligibilityResult }),
    })
      .then(r => r.json())
      .then(({ events: aiEvents }: { events: TimelineEvent[] }) => {
        if (!cancelled && Array.isArray(aiEvents) && aiEvents.length > 0) {
          setEvents(prev => mergeEvents(prev, aiEvents))
        }
      })
      .catch(() => {/* silently ignore — static events still show */})
      .finally(() => { if (!cancelled) setAiLoading(false) })

    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Merge document deadlines into the timeline whenever they change
  useEffect(() => {
    if (!docDeadlines || docDeadlines.length === 0) return
    setEvents(prev => {
      const docIds = new Set(docDeadlines.map(d => `doc_${d.fileName}_${d.label}`))
      const withoutOldDoc = prev.filter(e => !e.id.startsWith('doc_'))
      const docEvents: TimelineEvent[] = docDeadlines.map(d => ({
        id: `doc_${d.fileName}_${d.label}`,
        title: d.label,
        description: `Deadline from uploaded document: ${d.fileName}`,
        date: d.date,
        type: 'action' as const,
        status: (d.urgent ? 'action_required' : 'upcoming') as TimelineEvent['status'],
        urgent: d.urgent,
        aiSource: false,
      }))
      // Remove stale doc events not in current set and add new ones
      return [...withoutOldDoc.filter(e => !e.id.startsWith('doc_') || docIds.has(e.id)), ...docEvents]
        .sort((a, b) => a.date.localeCompare(b.date))
    })
  }, [docDeadlines])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Key enrollment windows and deadlines based on your profile. Dates marked <span className="font-semibold text-red-600">Action required</span> need your attention now.
        </p>
        {aiLoading && (
          <span className="flex items-center gap-1 text-xs text-brand-500 whitespace-nowrap">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Personalizing…
          </span>
        )}
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-100" />

        <AnimatedList staggerDelay={0.07} className="space-y-4">
          {events.map(event => {
            const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.action
            const Icon = cfg.icon
            const urgent = event.urgent || event.status === 'action_required'

            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  urgent ? 'bg-red-100' :
                  event.status === 'active' || event.status === 'ongoing' ? 'bg-brand-100' :
                  'bg-gray-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    urgent ? 'text-red-500' :
                    event.status === 'active' || event.status === 'ongoing' ? 'text-brand-600' :
                    'text-gray-400'
                  }`} />
                </div>

                {/* Card */}
                <div className={`flex-1 mb-1 p-4 rounded-xl border transition-all ${
                  urgent
                    ? 'bg-red-50 border-red-200'
                    : event.status === 'active' || event.status === 'ongoing'
                    ? 'bg-brand-50 border-brand-200'
                    : 'bg-white border-gray-100'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h4 className={`text-sm font-semibold ${urgent ? 'text-red-800' : 'text-gray-800'}`}>
                        {event.title}
                      </h4>
                      {event.aiSource && (
                        <span className="flex items-center gap-0.5 text-xs bg-brand-50 text-brand-600 border border-brand-200 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                          <Sparkles className="w-2.5 h-2.5" />
                          AI personalized
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_BADGE[event.status] || STATUS_BADGE.upcoming}`}>
                      {STATUS_LABEL[event.status] || event.status}
                    </span>
                  </div>

                  <p className={`text-xs mb-2 ${urgent ? 'text-red-700' : 'text-gray-500'}`}>
                    {formatDate(event.date, event.endDate)}
                  </p>

                  <p className={`text-sm leading-relaxed ${urgent ? 'text-red-700' : 'text-gray-600'}`}>
                    {event.description}
                  </p>

                  {event.actionUrl && (
                    <a
                      href={event.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      {event.actionLabel || 'Learn more'} →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </AnimatedList>
      </div>
    </div>
  )
}
