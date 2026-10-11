'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { sectionLabels, sections } from '../project-settings.types'
import { sectionOf } from '../section.utils'
import { settingsHref } from '../settings-links.utils'

/** The side panel: the sections of the settings of a project. */
export function SettingsNav({ projectId }: { projectId: string }) {
  const current = sectionOf(useSearchParams().get('section'))
  return (
    <nav aria-label="Sections" className="flex flex-col gap-px px-1 pb-2">
      {sections.map((section) => (
        <Link
          key={section}
          href={settingsHref(projectId, section) as Route}
          aria-current={section === current ? 'page' : undefined}
          className="rounded-md px-2 py-1 text-xs outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium"
        >
          {sectionLabels[section]}
        </Link>
      ))}
    </nav>
  )
}
