import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface SidePanelNavProps {
  /** Names the list for assistive technology. */
  label: string
  children: ReactNode
}

/** A list of links in a side panel, such as the sections of the settings. */
export function SidePanelNav({ label, children }: SidePanelNavProps) {
  return (
    <nav aria-label={label} className="flex flex-col gap-px px-1 pb-2">
      {children}
    </nav>
  )
}

interface SidePanelLinkProps {
  href: Route
  /** The link of the page on screen, set in medium weight on a filled row. */
  current: boolean
  children: ReactNode
}

/** A link of a `SidePanelNav`. */
export function SidePanelLink({ href, current, children }: SidePanelLinkProps) {
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className="rounded-md px-2 py-1 text-xs outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium"
    >
      {children}
    </Link>
  )
}
