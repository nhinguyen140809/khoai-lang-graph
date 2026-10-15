import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { LogoMark } from '@/shared/components/frame'

interface AuthScreenProps {
  title: string
  description: string
  /** The line under the form that leads to the other page, such as "No account yet? Create one". */
  switchTo: {
    prompt: string
    label: string
    href: Route
  }
  children: ReactNode
}

/**
 * The screen of the sign-in and the account pages: the app, a title, the form and a link, in one
 * column whose parts all start at the same left edge.
 */
export function AuthScreen({ title, description, switchTo, children }: AuthScreenProps) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-10">
      <div className="flex items-center gap-3">
        <LogoMark className="size-9 rounded-lg" />
        <span className="text-xl font-semibold tracking-tight">khoai</span>
      </div>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
      <p className="text-sm text-muted-foreground">
        {switchTo.prompt}{' '}
        <Link href={switchTo.href} className="text-primary underline-offset-4 hover:underline">
          {switchTo.label}
        </Link>
      </p>
    </div>
  )
}
