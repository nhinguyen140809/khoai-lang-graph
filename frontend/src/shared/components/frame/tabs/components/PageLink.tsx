'use client'

import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { useOpenPage } from '../../hooks/useOpenPage'

/**
 * A link that opens a page: a click opens it in the preview tab, a double click keeps its tab. A
 * click with a modifier key keeps its usual meaning.
 */
export function PageLink({ href, children }: { href: Route; children: ReactNode }) {
  const openPage = useOpenPage()

  return (
    <Link
      href={href}
      className="font-medium underline-offset-4 hover:underline"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
        event.preventDefault()
        openPage(href)
      }}
      onDoubleClick={() => {
        openPage(href, { keep: true })
      }}
    >
      {children}
    </Link>
  )
}
