'use client'
import { useState } from 'react'
import type { FlowchartNode, UserProfile } from '@/types'

interface Props {
  nodes: FlowchartNode[]
  edges: { from: string; to: string; label?: string }[]
  profile?: UserProfile
}

const STATUS_STYLES: Record<string, {
  bg: string; border: string; text: string; sub: string; dot: string; badge: string; badgeText: string
}> = {
  active:    { bg: 'bg-blue-50',   border: 'border-blue-400',  text: 'text-blue-900',  sub: 'text-blue-600',  dot: 'bg-blue-400',   badge: 'bg-blue-400',   badgeText: 'text-white' },
  eligible:  { bg: 'bg-green-50',  border: 'border-green-500', text: 'text-green-900', sub: 'text-green-700', dot: 'bg-green-500',  badge: 'bg-green-500',  badgeText: 'text-white' },
  ineligible:{ bg: 'bg-gray-50',   border: 'border-dashed border-gray-300', text: 'text-gray-400', sub: 'text-gray-400', dot: 'bg-gray-300', badge: 'bg-gray-300', badgeText: 'text-white' },
  pending:   { bg: 'bg-amber-50',  border: 'border-amber-300', text: 'text-amber-800', sub: 'text-amber-600', dot: 'bg-amber-400',  badge: 'bg-amber-400',  badgeText: 'text-white' },
}

const TYPE_ICON: Record<string, string> = {
  question: '?', result: '✓', action: '→', rule: '§',
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
        </div>
      )}
    </div>
  )
}

interface NodeCardProps {
  node: FlowchartNode
  selected: boolean
  edgeLabel?: string
  onSelect: (n: FlowchartNode | null) => void
}

function NodeCard({ node, selected, edgeLabel, onSelect }: NodeCardProps) {
  const s = STATUS_STYLES[node.status] ?? STATUS_STYLES.pending
  const isIneligible = node.status === 'ineligible'
  const isPrimary = node.primaryPath && !isIneligible

  return (
    <button
      onClick={() => onSelect(selected ? null : node)}
      className={[
        'rounded-xl border p-3 text-left transition-all w-full',
        s.bg,
        isPrimary ? 'border-2 shadow-sm ' + s.border : s.border,
        isIneligible ? 'opacity-50' : 'hover:shadow-sm',
        selected ? 'ring-2 ring-offset-1 ring-brand-400' : '',
      ].join(' ')}
    >
      {edgeLabel && (
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium mb-1.5 inline-block ${s.badge} ${s.badgeText}`}>
          {edgeLabel}
        </span>
      )}
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${s.dot}`}>
          {isIneligible ? '✕' : TYPE_ICON[node.type] ?? '·'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={`text-sm font-semibold leading-snug ${s.text} ${isIneligible ? 'line-through' : ''}`}>
              {node.label}
            </p>
            {isPrimary && (
              <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                Recommended
              </span>
            )}
            {isIneligible && (
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                Why not? ▾
              </span>
            )}
          </div>
          {node.subtitle && (
            <p className={`text-xs mt-0.5 leading-relaxed ${s.sub}`}>{node.subtitle}</p>
          )}
        </div>
      </div>
    </button>
  )
}

// Arrow connector SVG
function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center my-1 gap-0.5">
      {label && (
        <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-50 rounded-full border border-gray-200">
          {label}
        </span>
      )}
      <svg width="16" height="20" viewBox="0 0 16 20" className="text-gray-300">
        <line x1="8" y1="0" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="4,12 8,20 12,12" fill="currentColor" />
      </svg>
    </div>
  )
}

// Horizontal branch container for sibling nodes
function BranchRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 w-full justify-center flex-wrap">
      {children}
    </div>
  )
}

interface TreeNodeProps {
  nodeId: string
  nodeMap: Map<string, FlowchartNode>
  edgeLabelMap: Map<string, string>  // nodeId → label of incoming edge
  selected: FlowchartNode | null
  onSelect: (n: FlowchartNode | null) => void
  depth?: number
}

function TreeNode({ nodeId, nodeMap, edgeLabelMap, selected, onSelect, depth = 0 }: TreeNodeProps) {
  const node = nodeMap.get(nodeId)
  if (!node) return null

  const children = (node.children ?? []).filter(id => nodeMap.has(id))
  const isPrimaryNode = node.primaryPath && node.status !== 'ineligible'
  const maxWidth = depth === 0 ? 'max-w-sm' : isPrimaryNode ? 'max-w-xs' : 'max-w-[180px]'

  return (
    <div className={`flex flex-col items-center ${maxWidth} w-full`}>
      <div className="w-full">
        <NodeCard
          node={node}
          selected={selected?.id === node.id}
          edgeLabel={edgeLabelMap.get(nodeId)}
          onSelect={() => onSelect(selected?.id === node.id ? null : node)}
        />
      </div>
      {children.length > 0 && (
        <>
          {children.length === 1 ? (
            // Single child — straight arrow down
            <>
              <Arrow label={undefined} />
              <TreeNode
                nodeId={children[0]}
                nodeMap={nodeMap}
                edgeLabelMap={edgeLabelMap}
                selected={selected}
                onSelect={onSelect}
                depth={depth + 1}
              />
            </>
          ) : (
            // Multiple children — branch out
            <>
              <Arrow />
              <BranchRow>
                {children.map(childId => (
                  <TreeNode
                    key={childId}
                    nodeId={childId}
                    nodeMap={nodeMap}
                    edgeLabelMap={edgeLabelMap}
                    selected={selected}
                    onSelect={onSelect}
                    depth={depth + 1}
                  />
                ))}
              </BranchRow>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function EligibilityFlowchart({ nodes, edges, profile }: Props) {
  const [selected, setSelected] = useState<FlowchartNode | null>(null)

  if (!nodes.length) return null

  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  // Build incoming edge label map: nodeId → edge label from parent
  const edgeLabelMap = new Map<string, string>()
  edges.forEach(e => {
    if (e.label) edgeLabelMap.set(e.to, e.label)
  })

  // Find root (start node)
  const rootNode = nodes.find(n => n.id === 'start') ?? nodes[0]

  // Collect all nodes that are children of someone (to find orphans = disconnected top-level nodes)
  const childIds = new Set(nodes.flatMap(n => n.children ?? []))
  const orphans = nodes.filter(n => n.id !== rootNode.id && !childIds.has(n.id))

  function handleSelect(node: FlowchartNode | null) {
    setSelected(prev => (prev?.id === node?.id ? null : node))
  }

  return (
    <div className="space-y-4">
      {profile && <ProfileSummaryNode profile={profile} />}
      {profile && <Arrow />}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span>Eligible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-300" />
          <span>Not eligible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span>Proceed with caution</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded-full font-medium text-xs">Recommended</span>
          <span>= AI recommended path</span>
        </div>
        <span className="text-gray-400 ml-1">· Click any node for details</span>
      </div>

      {/* Main tree from root */}
      <div className="flex flex-col items-center w-full">
        <TreeNode
          nodeId={rootNode.id}
          nodeMap={nodeMap}
          edgeLabelMap={edgeLabelMap}
          selected={selected}
          onSelect={handleSelect}
        />
      </div>

      {/* Orphan nodes (not connected via children, e.g. if engine didn't set children) */}
      {orphans.length > 0 && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-2">
          {orphans.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              selected={selected?.id === node.id}
              edgeLabel={edgeLabelMap.get(node.id)}
              onSelect={() => handleSelect(selected?.id === node.id ? null : node)}
            />
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLES[selected.status].dot}`} />
              <h4 className="font-semibold text-gray-900 text-sm">{selected.label}</h4>
              <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                {selected.status}
              </span>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500 text-base leading-none flex-shrink-0">✕</button>
          </div>

          {selected.explanation && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">The rule</p>
              <p className="text-sm text-gray-700 leading-relaxed">{selected.explanation}</p>
            </div>
          )}

          {selected.legalBasis && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Legal basis</p>
              <p className="text-xs text-gray-700 font-mono">{selected.legalBasis}</p>
            </div>
          )}

          {(selected.whatWouldChange ?? selected.whatChangesThis) && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-amber-700 mb-0.5">What would change this?</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                {selected.whatWouldChange ?? selected.whatChangesThis}
              </p>
            </div>
          )}

          {selected.profileData && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-blue-700 mb-0.5">Your data</p>
              <p className="text-xs text-blue-700 leading-relaxed font-mono">{selected.profileData}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
