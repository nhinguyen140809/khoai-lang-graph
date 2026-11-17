import type { ReactNode } from 'react'

interface ChoiceLayoutProps {
  children: ReactNode
}

/** The page that asks which view to use: a blank page with its content in the middle. */
export default function ChoiceLayout({ children }: ChoiceLayoutProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12 text-foreground">
      {children}
    </main>
  )
}
