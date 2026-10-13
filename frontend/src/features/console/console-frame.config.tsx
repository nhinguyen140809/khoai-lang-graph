import { SquareChevronRightIcon } from 'lucide-react'

import type { FeatureActivity, TabIcons } from '@/shared/components/frame'
import { SidePanel } from '@/shared/components/frame'
import { consoleHref } from '@/shared/config/routes.utils'

import { ConsoleNavigator } from './components/ConsoleNavigator'

/** The console on the activity bar, with the outline of its event log as the side panel. */
export function consoleActivity(projectId: string): FeatureActivity {
  return {
    id: 'console',
    label: 'Console',
    icon: <SquareChevronRightIcon />,
    href: consoleHref(projectId),
    panel: (
      <SidePanel title="Console">
        <ConsoleNavigator projectId={projectId} />
      </SidePanel>
    ),
  }
}

/** The name of the tab icon of the console, which its page gives `useEditorTab`. */
export const ConsoleTabIcon = { Console: 'console.console' } as const

export const consoleTabIcons: TabIcons = { [ConsoleTabIcon.Console]: <SquareChevronRightIcon /> }
