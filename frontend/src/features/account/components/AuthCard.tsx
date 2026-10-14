import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { LogoMark } from '@/shared/components/frame'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

interface AuthCardProps {
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

/** The frame of the sign-in and the account pages: the app, a title, the form, a link. */
export function AuthCard({ title, description, switchTo, children }: AuthCardProps) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex items-center gap-2 text-sm">
        <LogoMark className="size-6" />
        <span className="font-medium">khoai</span>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <h1 className="text-base">{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        {switchTo.prompt}{' '}
        <Link href={switchTo.href} className="text-primary underline-offset-4 hover:underline">
          {switchTo.label}
        </Link>
      </p>
    </div>
  )
}
