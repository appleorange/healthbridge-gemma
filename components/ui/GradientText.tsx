'use client'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  from?: string
  to?: string
}

export default function GradientText({
  children,
  className = '',
  from = '#588157',
  to = '#a3b18a',
}: Props) {
  return (
    <span
      className={className}
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  )
}
