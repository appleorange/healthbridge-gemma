'use client'
import { useState } from 'react'
import type { FlowchartNode, FlowchartEdge, UserProfile } from '@/types'

interface Props {
  nodes: FlowchartNode[]
  edges: FlowchartEdge[]
  profile?: UserProfile
}

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; subtextColor: string; dot: string; badgeBg: string; badgeText: string }> = {
  active:    { bg: 'bg-blue-50',   border: 'border-blue-300',  text: 'text-blue-900',  subtextColor: 'text-blue-600',  dot: 'bg-blue-400',   badgeBg: 'bg-blue-400',   badgeText: 'text-white' },
  eligible:  { bg: 'bg-green-50',  border: 'border-green-400', text: 'text-green-900', subtextColor: 'text-green-600', dot: 'bg-green-500',  badgeBg: 'bg-green-500',  badgeText: 'text-white' },
  ineligible:{ bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',   subtextColor: 'text-red-400',   dot: 'bg-red-300',    badgeBg: 'bg-red-300',    badgeText: 'text-white' },
  pending:   { bg: 'bg-amber-50',  border: 'border-amber-300', text: 'text-amber-800', subtextColor: 'text-amber-600', dot: 'bg-amber-400',  badgeBg: 'bg-amber-400',  badgeText: 'text-white' },
}

const TYPE_ICON: Record<string, string> = {
  question: '?',
  result:   '✓',
  action:   '→',
  rule:     '§',
}

const BENEFIT_LABELS: Record<string, string> = {
  vision: '👁 Vision', dental: '🦷 Dental', hearing: '👂 Hearing',
  mental_health: '🧠 Mental health', maternity: '🤱 Maternity',
  prescriptions: '💊 Prescriptions', fitness: '🏋️ Fitness',
  transportation: '🚗 Transportation', over_the_counter: '🛒 OTC',
  specialist_access: '🏥 Specialist access', emergency_care: '🚑 Emergency',
}

function ProfileSummaryNode({ profile }: { profile: UserProfile }) {
  const [open, setOpen] = useState(false)

  const chips = [
    profile.state && `📍 ${profile.zipCode ?? profile.state}`,
    profile.age && `Age ${profile.age}`,
    profile.annualIncome && `$${profile.annualIncome.toLocaleString()}/yr`,
    profile.householdSize > 1 && `Household: ${profile.householdSize}`,
    profile.university && `🎓 ${profile.university}`,
    profile.employerName && `💼 ${profile.employerName}`,
  ].filter(Boolean) as string[]

  const benefits = (profile.benefitPriorities ?? []).map(b => BENEFIT_LABELS[b]).filter(Boolean)

  return (
    <div className="rounded-xl border border-blue-300 bg-blue-50 p-3 max-w-sm mx-auto">
      <button onClick={() => setOpen(o => !o)} className="w-full text-left">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">i</span>
          <p className="text-sm font-semibold text-blue-900">Your profile</p>
          <span className="ml-auto text-blue-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c, i) => (
              <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c}</span>
            ))}
          </div>
          {benefits.length > 0 && (
            <div>
              <p className="text-xs text-blue-600 font-medium mb-1">Benefit priorities</p>
              <div className="flex flex-wrap gap-1">
                {benefits.map((b, i) => (
                  <span key={i} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full">{b}</span>
                ))}
              </div>
            </div>
          )}
          {profile.hospitalVisitFrequency && (
            <p className="text-xs text-blue-600">🏥 Hospital visits: {profile.hospitalVisitFrequency.replace(/_/g, ' ')}</p>
          )}
          {profile.hasChronicConditions && profile.chronicConditionList && (
            <p className="text-xs text-blue-600">⚕️ Conditions: {profile.chronicConditionList}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function EligibilityFlowchart({ nodes, edges, profile }: Props) {
  const [selected, setSelected] = useState<FlowchartNode | null>(null)

  if (!nodes.length) return null

  const [first, ...rest] = nodes
  const rows: FlowchartNode[][] = [[first]]
  for (let i = 0; i < rest.length; i += 3) {
    rows.push(rest.slice(i, i + 3))
  }

  // Build edge lookup for labels
  const edgeMap: Record<string, string[]> = {}
  edges.forEach(e => {
    if (e.label) {
      edgeMap[e.to] = [...(edgeMap[e.to] ?? []), e.label]
    }
  })

  return (
    <div className="space-y-4">
      {/* Profile summary node at top */}
      {profile && <ProfileSummaryNode profile={profile} />}

      {/* Connector from profile to first node */}
      {profile && (
        <div className="flex justify-center">
          <div className="w-px h-5 bg-gray-300" />
        </div>
      )}

      {/* Flowchart nodes */}
      <div className="space-y-3">
        {rows.map((row, ri) => (
          <div key={ri}>
            {ri > 0 && (
              <div className="flex justify-center my-1">
                <div className="w-px h-6 bg-gray-300" />
              </div>
            )}
            <div className={`grid gap-3 ${row.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : row.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {row.map(node => {
                const s = STATUS_STYLES[node.status]
                const isIneligible = node.status === 'ineligible'
                const edgeLabels = edgeMap[node.id] ?? []
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelected(selected?.id === node.id ? null : node)}
                    className={`rounded-xl border p-3 text-left transition-all hover:shadow-sm ${s.bg} ${s.border} ${
                      isIneligible ? 'opacity-60' : ''
                    } ${selected?.id === node.id ? 'ring-2 ring-offset-1 ring-brand-400' : ''}`}
                  >
                    {/* Edge label badge */}
                    {edgeLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {edgeLabels.map((l, i) => (
                          <span key={i} className={`text-xs px-1.5 py-0.5 rounded font-medium ${s.badgeBg} ${s.badgeText}`}>{l}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${s.dot}`}>
                        {isIneligible ? '✕' : TYPE_ICON[node.type]}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold leading-snug ${s.text} ${isIneligible ? 'line-through opacity-70' : ''}`}>
                          {node.label}
                        </p>
                        {node.subtitle && (
                          <p className={`text-xs mt-0.5 truncate ${s.subtextColor}`}>{node.subtitle}</p>
                        )}
                        {node.legalBasis && (
                          <p className="text-xs text-gray-400 mt-1 font-mono truncate">{node.legalBasis}</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLES[selected.status].dot}`} />
              <h4 className="font-semibold text-gray-900 text-sm">{selected.label}</h4>
              <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">{selected.status}</span>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500 text-base leading-none">✕</button>
          </div>

          {selected.explanation && (
            <p className="text-sm text-gray-600 leading-relaxed">{selected.explanation}</p>
          )}

          {selected.legalBasis && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Legal basis</p>
              <p className="text-xs text-gray-700 font-mono">{selected.legalBasis}</p>
            </div>
          )}

          {selected.status === 'ineligible' && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-amber-700 mb-0.5">What would change this?</p>
              <p className="text-xs text-amber-600">
                {selected.label.includes('ACA') && 'Changing to a qualifying immigration status (green card, citizenship, refugee) would flip this node.'}
                {selected.label.includes('Medicaid') && 'Receiving a green card and waiting 5 years, or living in a state with expanded immigrant Medicaid, could make you eligible.'}
                {selected.label.includes('Medicare') && 'Turning 65 or qualifying with a long-term disability would unlock Medicare.'}
                {!selected.label.includes('ACA') && !selected.label.includes('Medicaid') && !selected.label.includes('Medicare') && 'A change in your immigration status, income, employment, or state of residence may affect this.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {Object.entries(STATUS_STYLES).map(([status, s]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
            <span className="text-xs text-gray-500 capitalize">{status}</span>
          </div>
        ))}
        <span className="text-xs text-gray-400 ml-2">· Click any node for details</span>
      </div>
    </div>
  )
}
