import { SettingsIcon } from 'lucide-react'

import type { TabIcons } from '@/shared/components/frame'

/** The name of the tab icon of the settings, which their page gives `useEditorTab`. */
export const ProjectSettingsTabIcon = { Settings: 'project-settings.settings' } as const

export const projectSettingsTabIcons: TabIcons = {
  [ProjectSettingsTabIcon.Settings]: <SettingsIcon />,
}
