'use client'

import { cn } from 'cn'
import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { useOpenPage } from '../../hooks/useOpenPage'

type PageLinkProps = {
  href: Route
  children: ReactNode
  className?: string | undefined
} & Omit<
  React.ComponentProps<typeof Link>,
  'href' | 'children' | 'className' | 'onClick' | 'onDoubleClick'
>

/**
 * A link that opens a page: a click opens it in the preview tab, a double click keeps its tab. A
 * click with a modifier key keeps its usual meaning. A `className` adds to the look of the link,
 * overriding what it names (tailwind-merge).
 */
export function PageLink({ href, children, className, ...props }: PageLinkProps) {
  const openPage = useOpenPage()

  return (
    <Link
      href={href}
      className={cn('font-medium underline-offset-4 hover:underline', className)}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
        event.preventDefault()
        openPage(href)
      }}
      onDoubleClick={() => {
        openPage(href, { keep: true })
      }}
      {...props}
    >
      {children}
    </Link>
  )
}
