'use client'

import { usePathname, useSearchParams } from 'next/navigation'

import { SidePanelLink, SidePanelNav } from '@/shared/components/frame'
import { RouteParam, routes } from '@/shared/config/routes'

import { settingsSectionOf } from '../section.utils'
import { settingsSectionLabels, settingsSections } from '../settings.types'

/** The sections of the settings of the user; the one open is marked while their page is on screen. */
export function UserSettingsNav() {
  const onPage = usePathname() === routes.settings()
  const current = settingsSectionOf(useSearchParams().get(RouteParam.Section))

  return (
    <SidePanelNav label="Your settings">
      {settingsSections.map((section) => (
        <SidePanelLink
          key={section}
          href={routes.settings(section)}
          current={onPage && section === current}
        >
          {settingsSectionLabels[section]}
        </SidePanelLink>
      ))}
    </SidePanelNav>
  )
}
