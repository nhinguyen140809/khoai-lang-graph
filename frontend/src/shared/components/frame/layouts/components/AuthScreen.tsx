import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { AppName } from '@/shared/components/brand'
import { Card, CardContent } from '@/shared/components/ui/card'

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
 * The screen of the login and the account pages: the app, a title, the form and a link, in one
 * column whose parts all start at the same left edge, on a card that lets a little of the backdrop
 * show through, so that the fields do not lie on the plain glow.
 */
export function AuthScreen({ title, description, switchTo, children }: AuthScreenProps) {
  return (
    <Card className="w-full max-w-md bg-card/70 py-8">
      <CardContent className="flex flex-col gap-10 px-8">
        <AppName size="lg" />
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
      </CardContent>
    </Card>
  )
}
