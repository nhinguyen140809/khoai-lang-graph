import type { ReactNode } from 'react'

import { GlowStage } from '@/shared/components/animation'

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * The pages that need no session: logging in and registering. Their column starts at a
 * fixed distance from the top, so that a message of an error pushes only what is under it.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <GlowStage
      as="main"
      arrangement="mirror"
      className="flex min-h-svh items-start justify-center px-6 pt-16 pb-12 text-foreground sm:pt-24"
    >
      {children}
    </GlowStage>
  )
}
