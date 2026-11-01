'use client'

import { usePathname, useSearchParams } from 'next/navigation'

import { SidePanelLink, SidePanelNav } from '@/shared/components/frame'
import { RouteParam, routes } from '@/shared/config/routes'

import { sectionLabels, sections } from '../project-settings.types'
import { sectionOf } from '../section.utils'

/** The sections of the settings of a project; the one open is marked while their page is on screen. */
export function ProjectSettingsNav({ projectId }: { projectId: string }) {
  const onPage = usePathname() === routes.project(projectId).settings()
  const current = sectionOf(useSearchParams().get(RouteParam.Section))

  return (
    <SidePanelNav label="Project settings">
      {sections.map((section) => (
        <SidePanelLink
          key={section}
          href={routes.project(projectId).settings(section)}
          current={onPage && section === current}
        >
          {sectionLabels[section]}
        </SidePanelLink>
      ))}
    </SidePanelNav>
  )
}
