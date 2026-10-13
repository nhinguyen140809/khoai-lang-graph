import { SettingsIcon } from 'lucide-react'

import type { FeatureActivity, TabIcons } from '@/shared/components/frame'
import { SidePanel } from '@/shared/components/frame'
import { settingsHref } from '@/shared/config/routes.utils'

import { SettingsNav } from './components/SettingsNav'

/**
 * The settings of the project, at the bottom of the activity bar, with their sections as the side
 * panel.
 */
export function projectSettingsActivity(projectId: string): FeatureActivity {
  return {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    placement: 'bottom',
    href: settingsHref(projectId),
    panel: (
      <SidePanel title="Project settings">
        <SettingsNav projectId={projectId} />
      </SidePanel>
    ),
  }
}

/** The name of the tab icon of the settings, which their page gives `useEditorTab`. */
export const ProjectSettingsTabIcon = { Settings: 'project-settings.settings' } as const

export const projectSettingsTabIcons: TabIcons = {
  [ProjectSettingsTabIcon.Settings]: <SettingsIcon />,
}
