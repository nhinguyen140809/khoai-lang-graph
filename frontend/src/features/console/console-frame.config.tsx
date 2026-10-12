import { SquareChevronRightIcon } from 'lucide-react'
import type { Route } from 'next'

import type { FeatureActivity, TabIcons } from '@/components/layout'
import { SidePanel } from '@/components/layout'

import { ConsoleNavigator } from './components/ConsoleNavigator'

/** The address of the console of a project. */
export function consoleHref(projectId: string): Route {
  return `/projects/${encodeURIComponent(projectId)}/console` as Route
}

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

export const consoleTabIcons: TabIcons = { console: <SquareChevronRightIcon /> }
