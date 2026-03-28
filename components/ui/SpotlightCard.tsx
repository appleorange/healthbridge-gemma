'use client'
import { useRef } from 'react'
import type { ReactNode, MouseEvent } from 'react'

interface Props {
  children: ReactNode
  className?: string
  spotlightColor?: string
}

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(88, 129, 87, 0.12)',
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    card.style.setProperty('--x', `${x}px`)
    card.style.setProperty('--y', `${y}px`)
  }

  function handleMouseLeave() {
    const card = cardRef.current
    if (!card) return
    card.style.setProperty('--x', '-9999px')
    card.style.setProperty('--y', '-9999px')
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
      style={
        {
          '--x': '-9999px',
          '--y': '-9999px',
          '--spotlight': spotlightColor,
        } as React.CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(200px circle at var(--x) var(--y), var(--spotlight), transparent 80%)',
        }}
      />
      {children}
    </div>
  )
}
