'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface Props {
  value: number
  max?: number
  color?: string
  bgColor?: string
  height?: number
  className?: string
}

export default function AnimatedProgressBar({
  value,
  max = 100,
  color = '#588157',
  bgColor = '#dad7cd',
  height = 6,
  className = '',
}: Props) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const pct = Math.min(100, Math.round((value / max) * 100))

  return (
    <div
      ref={ref}
      className={`overflow-hidden rounded-full ${className}`}
      style={{ background: bgColor, height }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={isInView ? { width: `${pct}%` } : { width: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        style={{ background: color, height: '100%', borderRadius: 9999 }}
      />
    </div>
  )
}
