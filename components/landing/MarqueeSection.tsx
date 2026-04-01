'use client'
import Marquee from '@/components/ui/Marquee'

const ROW_ONE = [
  'US Citizens', 'Green Card (LPR)', 'H-1B / H-4', 'F-1 Students',
  'F-1 OPT', 'J-1 Scholars', 'J-2 Dependents', 'L-1 Visa',
]
const ROW_TWO = [
  'DACA Recipients', 'Refugees & Asylees', 'O-1 / TN Visa',
  'Undocumented', 'H-4 Dependents', 'Retired', 'Self-employed',
]

export function MarqueeSection() {
  return (
    <section className="pb-20 overflow-hidden w-full" style={{ background: '#eeeee8' }}>
      <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
        Covers all immigration statuses
      </p>
      <div className="space-y-3">
        <Marquee speed={35} pauseOnHover>
          {ROW_ONE.map(label => (
            <span
              key={label}
              className="flex-shrink-0 px-5 py-2.5 bg-white border border-brand-200 rounded-full text-sm font-medium text-brand-700 mx-1.5 whitespace-nowrap"
            >
              {label}
            </span>
          ))}
        </Marquee>
        <Marquee speed={28} reverse pauseOnHover>
          {ROW_TWO.map(label => (
            <span
              key={label}
              className="flex-shrink-0 px-5 py-2.5 bg-brand-100 border border-brand-200 rounded-full text-sm font-medium text-brand-700 mx-1.5 whitespace-nowrap"
            >
              {label}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
