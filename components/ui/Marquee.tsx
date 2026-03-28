'use client'
import React from 'react'

interface MarqueeProps {
  children: React.ReactNode
  reverse?: boolean
  pauseOnHover?: boolean
  speed?: number
  className?: string
}

export default function Marquee({
  children,
  reverse = false,
  pauseOnHover = false,
  speed = 40,
  className = '',
}: MarqueeProps) {
  return (
    <div
      className={`flex overflow-hidden ${className}`}
      style={{ '--speed': `${speed}s` } as React.CSSProperties}
    >
      {[0, 1].map(i => (
        <div
          key={i}
          className="flex shrink-0 gap-3 items-center"
          style={{
            animation: `marquee var(--speed) linear infinite ${reverse ? 'reverse' : ''}`,
            animationPlayState: 'running',
          }}
          onMouseEnter={e => { if (pauseOnHover) (e.currentTarget as HTMLElement).style.animationPlayState = 'paused' }}
          onMouseLeave={e => { if (pauseOnHover) (e.currentTarget as HTMLElement).style.animationPlayState = 'running' }}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
