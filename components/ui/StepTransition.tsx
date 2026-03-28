'use client'
import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  stepKey: string | number
  direction?: 'forward' | 'backward'
}

export default function StepTransition({ children, stepKey, direction = 'forward' }: Props) {
  const x = direction === 'forward' ? 40 : -40

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -x }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
