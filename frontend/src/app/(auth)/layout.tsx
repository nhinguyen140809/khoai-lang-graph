import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * The pages that need no session: logging in and registering. Their column starts at a
 * fixed distance from the top, so that a message of an error pushes only what is under it.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-svh items-start justify-center bg-background px-6 pt-16 pb-12 text-foreground sm:pt-24">
      {children}
    </main>
  )
}
