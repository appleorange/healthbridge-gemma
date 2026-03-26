'use client'
import { Calendar, AlertCircle, Clock, CheckCircle, Info } from 'lucide-react'
import type { UserProfile, TimelineEvent } from '@/types'

function generateEvents(profile: UserProfile): TimelineEvent[] {
  const today = new Date()
  const year = today.getFullYear()

  // Open Enrollment window (Nov 1 – Jan 15)
  const oeStart = new Date(`${year}-11-01`)
  const oeEnd = new Date(`${year + 1}-01-15`)
  const inOE = today >= oeStart && today <= oeEnd
  const oeUpcoming = today < oeStart

  const events: TimelineEvent[] = []

  // --- ACA Open Enrollment ---
  const acaStatuses = ['us_citizen', 'green_card', 'refugee_asylee', 'l1', 'o1', 'tn']
  if (acaStatuses.includes(profile.immigrationStatus)) {
    events.push({
      id: 'oe',
      title: 'ACA Open Enrollment',
      description: `Annual window to enroll in or switch ACA marketplace plans. Covers plans starting January 1. ${inOE ? 'You are currently in Open Enrollment — act now.' : oeUpcoming ? `Starts November 1, ${year}.` : `Next window opens November 1, ${year}.`}`,
      date: `${year}-11-01`,
      endDate: `${year + 1}-01-15`,
      type: 'open_enrollment',
      status: inOE ? 'active' : 'upcoming',
      urgent: inOE,
      actionLabel: 'Browse plans',
      actionUrl: 'https://www.healthcare.gov',
    })
  }

  // --- Medicaid (year-round) ---
  const medicaidStatuses = ['us_citizen', 'green_card', 'refugee_asylee', 'daca']
  if (medicaidStatuses.includes(profile.immigrationStatus)) {
    events.push({
      id: 'medicaid_year_round',
      title: 'Medicaid Enrollment',
      description: 'Medicaid accepts applications year-round — no open enrollment window. If your income qualifies, you can apply any time and coverage often starts the same month.',
      date: `${year}-01-01`,
      type: 'medicaid',
      status: 'ongoing',
      actionLabel: 'Apply now',
      actionUrl: 'https://www.healthcare.gov/medicaid-chip/',
    })
  }

  // --- SEP Triggers ---
  events.push({
    id: 'sep_job_loss',
    title: 'SEP: Job loss or loss of coverage',
    description: 'Losing employer-sponsored insurance is a qualifying life event. You have 60 days from losing coverage to enroll in an ACA marketplace plan — even outside Open Enrollment.',
    date: today.toISOString().split('T')[0],
    type: 'sep',
    status: profile.employmentStatus === 'unemployed' ? 'action_required' : 'upcoming',
    urgent: profile.employmentStatus === 'unemployed',
    actionLabel: 'Learn about SEPs',
    actionUrl: 'https://www.healthcare.gov/coverage-outside-open-enrollment/special-enrollment-period/',
  })

  events.push({
    id: 'sep_other',
    title: 'SEP: Marriage, birth, or moving',
    description: 'Getting married, having a baby, or moving to a new state or ZIP code all trigger a 60-day Special Enrollment Period. You can enroll in or change your marketplace plan within that window.',
    date: today.toISOString().split('T')[0],
    type: 'sep',
    status: 'upcoming',
  })

  // --- COBRA ---
  if (profile.employmentStatus === 'unemployed') {
    // Calculate 60 days from "now" as an example deadline
    const cobraDeadline = new Date(today)
    cobraDeadline.setDate(cobraDeadline.getDate() + 60)
    events.push({
      id: 'cobra_election',
      title: 'COBRA Election Window',
      description: 'You have 60 days from losing employer coverage to elect COBRA. The deadline is strict — missing it means you lose the option. COBRA is expensive (full premium) but keeps your existing network.',
      date: cobraDeadline.toISOString().split('T')[0],
      type: 'cobra',
      status: 'action_required',
      urgent: true,
      actionLabel: 'Learn about COBRA',
      actionUrl: 'https://www.dol.gov/general/topic/health-plans/cobra',
    })
  }

  // --- University plan deadlines ---
  if (profile.isStudent || ['f1_student', 'j1_scholar', 'j2', 'f1_opt'].includes(profile.immigrationStatus)) {
    // Fall enrollment typically Aug–Sep
    const fallDeadline = new Date(`${year}-09-15`)
    const springDeadline = new Date(`${year + 1}-01-31`)
    const nextFallDeadline = new Date(`${year + 1}-09-15`)

    events.push({
      id: 'school_fall',
      title: 'University Plan: Fall Enrollment / Waiver Deadline',
      description: 'Most universities require insurance enrollment or an approved waiver by mid-September for the fall semester. Log into your student portal to check your school\'s exact deadline.',
      date: (today > fallDeadline ? nextFallDeadline : fallDeadline).toISOString().split('T')[0],
      type: 'university',
      status: today <= fallDeadline ? 'upcoming' : 'upcoming',
      urgent: false,
    })

    events.push({
      id: 'school_spring',
      title: 'University Plan: Spring Enrollment / Waiver Deadline',
      description: 'Spring semester deadlines are typically late January. If you\'re adding or waiving coverage for spring, check your student portal now.',
      date: springDeadline.toISOString().split('T')[0],
      type: 'university',
      status: 'upcoming',
    })

    if (profile.yearsLeftInCollege === 'less_than_1') {
      const gradDate = new Date(today)
      gradDate.setMonth(gradDate.getMonth() + 8)
      events.push({
        id: 'graduation_transition',
        title: 'Post-graduation coverage transition',
        description: 'Your school plan ends when you graduate. Graduation is a qualifying life event — you have 60 days to enroll in a new plan. Start planning now: explore ACA marketplace, employer coverage, or an alumni plan.',
        date: gradDate.toISOString().split('T')[0],
        type: 'action',
        status: 'action_required',
        urgent: true,
      })
    }
  }

  // --- J-1 mandatory insurance ---
  if (profile.immigrationStatus === 'j1_scholar') {
    events.push({
      id: 'j1_mandate',
      title: 'J-1 Insurance Requirement (Ongoing)',
      description: 'Federal law (22 CFR 62.14) requires J-1 scholars to maintain insurance meeting minimum standards: $100,000 per accident/illness, $25,000 for medical evacuation, $50,000 for repatriation. Verify your plan meets these thresholds.',
      date: today.toISOString().split('T')[0],
      type: 'action',
      status: 'ongoing',
      urgent: false,
    })
  }

  // --- Sort: action_required first, then by date ---
  return events.sort((a, b) => {
    const statusOrder = { action_required: 0, active: 1, ongoing: 2, upcoming: 3, past: 4 }
    const sa = statusOrder[a.status] ?? 3
    const sb = statusOrder[b.status] ?? 3
    if (sa !== sb) return sa - sb
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
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

interface Props {
  profile: UserProfile
}

export default function EnrollmentTimeline({ profile }: Props) {
  const events = generateEvents(profile)

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Key enrollment windows and deadlines based on your profile. Dates marked <span className="font-semibold text-red-600">Action required</span> need your attention now.
      </p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-100" />

        <div className="space-y-4">
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
                    <h4 className={`text-sm font-semibold ${urgent ? 'text-red-800' : 'text-gray-800'}`}>
                      {event.title}
                    </h4>
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
        </div>
      </div>
    </div>
  )
}
