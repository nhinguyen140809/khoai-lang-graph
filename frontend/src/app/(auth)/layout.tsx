import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

/** The pages that need no session: signing in and creating an account. */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      {children}
    </main>
  )
}
