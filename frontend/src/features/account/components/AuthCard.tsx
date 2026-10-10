import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthCardProps {
  title: string
  description: string
  /** A line under the form, such as the link to the other page. */
  footer: ReactNode
  children: ReactNode
}

/** The frame of the sign-in and the account pages: the app, a title, the form, a link. */
export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex items-center gap-2 text-sm">
        <span
          aria-hidden
          className="flex size-6 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-primary-foreground"
        >
          K
        </span>
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
      <p className="text-xs text-muted-foreground">{footer}</p>
    </div>
  )
}
