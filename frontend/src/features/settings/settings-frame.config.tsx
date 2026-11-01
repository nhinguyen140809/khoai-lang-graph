import { SettingsIcon } from 'lucide-react'
import type { Route } from 'next'
import type { ReactNode } from 'react'

import { type FeatureActivity, SidePanel, SidePanelSection } from '@/shared/components/frame'
import { routes } from '@/shared/config/routes'

import { UserSettingsNav } from './components/UserSettingsNav'

interface SettingsActivityOptions {
  /** The start page of the item; inside a project, the settings of the project. */
  href?: Route
  /** The sections of the settings of the project, listed under those of the user. */
  projectSections?: ReactNode
}

/**
 * The settings, at the bottom of the activity bar on every screen. The side panel lists the
 * sections of the settings of the user and, inside a project, those of the project.
 */
export function settingsActivity({
  href = routes.settings(),
  projectSections,
}: SettingsActivityOptions = {}): FeatureActivity {
  return {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    placement: 'bottom',
    href,
    panel: (
      <SidePanel title="Settings">
        <SidePanelSection title="You">
          <UserSettingsNav />
        </SidePanelSection>
        {projectSections !== undefined && (
          <SidePanelSection title="This project">{projectSections}</SidePanelSection>
        )}
      </SidePanel>
    ),
  }
}
