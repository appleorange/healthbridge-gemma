'use client'
import { useState } from 'react'
import { FileText, Phone, CheckCircle, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import type { ChecklistItem } from '@/types'

interface Props {
  items: ChecklistItem[]
}

const CATEGORY_CONFIG = {
  document: {
    icon: FileText,
    label: 'Gather documents',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    dot: 'bg-blue-400',
  },
  call: {
    icon: Phone,
    label: 'Who to contact',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
    dot: 'bg-green-400',
  },
  action: {
    icon: CheckCircle,
    label: 'Actions to take',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    dot: 'bg-purple-400',
  },
  deadline: {
    icon: Clock,
    label: 'Deadlines',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    dot: 'bg-red-400',
  },
} as const

export default function ActionChecklist({ items }: Props) {
  const [expanded, setExpanded] = useState<string | null>(items[0]?.title ?? null)

  const urgentItems = items.filter(i => i.urgent)
  const normalItems = items.filter(i => !i.urgent)
  const ordered = [...urgentItems, ...normalItems]

  return (
    <div className="space-y-2">
      {ordered.map(item => {
        const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.action
        const Icon = cfg.icon
        const isOpen = expanded === item.title

        return (
          <div
            key={item.title}
            className={`rounded-xl border overflow-hidden transition-all ${
              item.urgent ? 'border-red-200 bg-red-50' : `${cfg.border} bg-white`
            }`}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : item.title)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                item.urgent ? 'bg-red-100' : cfg.bg
              }`}>
                {item.urgent
                  ? <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  : <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                  {item.urgent && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                      Urgent
                    </span>
                  )}
                </div>
                <p className={`text-xs font-medium ${item.urgent ? 'text-red-500' : cfg.color}`}>
                  {cfg.label}
                </p>
              </div>
              {isOpen
                ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              }
            </button>

            {isOpen && (
              <div className="px-4 pb-4">
                <div className="ml-10">
                  <p className="text-sm text-gray-600 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
