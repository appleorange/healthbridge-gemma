'use client'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const EASE = [0.22, 1, 0.36, 1] as const

interface Props {
  children: ReactNode
  index: number
}

export function AnimatedField({ children, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
