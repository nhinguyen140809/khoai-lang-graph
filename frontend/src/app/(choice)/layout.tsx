import type { ReactNode } from 'react'

import { GlowStage } from '@/shared/components/animation'

interface ChoiceLayoutProps {
  children: ReactNode
}

/** The page that asks which view to use: a blank page with its content in the middle. */
export default function ChoiceLayout({ children }: ChoiceLayoutProps) {
  return (
    <GlowStage
      as="main"
      arrangement="corners"
      className="flex min-h-svh items-center justify-center px-6 py-12 text-foreground"
    >
      {children}
    </GlowStage>
  )
}
