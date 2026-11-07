import { ActivityIcon } from 'lucide-react'

import type { FeatureDestination } from '@/shared/components/frame'
import { routes } from '@/shared/routes'

import { ActivityPanel } from './components/ActivityPanel'

/** Activity on the activity bar of a project: the progress and the outline, with the chat in a tab. */
export function activityDestination(projectId: string): FeatureDestination {
  return {
    id: 'activity',
    label: 'Activity',
    icon: <ActivityIcon />,
    href: routes.project(projectId).activity(),
    panel: <ActivityPanel projectId={projectId} />,
  }
}
