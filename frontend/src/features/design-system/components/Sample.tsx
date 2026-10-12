import { cn } from 'cn'
import type { ComponentProps, ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/** A card of the page: a title, a short description, and the samples. */
export function SampleCard({
  title,
  description,
  className,
  children,
}: {
  title: string
  description: ReactNode
  /** Classes of the card content, which lays out the samples. */
  className?: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={className}>{children}</CardContent>
    </Card>
  )
}

/** A small monospaced caption that names the sample next to it: a variant, a token, a tag. */
export function SampleLabel({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('font-mono text-3xs text-muted-foreground', className)} {...props} />
}

/** A captioned group of samples, for example one variant of a component in every color. */
export function SampleGroup({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <SampleLabel>{label}</SampleLabel>
      {children}
    </div>
  )
}
