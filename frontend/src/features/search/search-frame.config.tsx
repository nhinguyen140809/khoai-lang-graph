import { SearchIcon } from 'lucide-react'

import type { FeatureActivity } from '@/shared/components/frame'
import { SidePanel } from '@/shared/components/frame'
import { routes } from '@/shared/config/routes'

import { SearchPanel } from './components/SearchPanel'

/**
 * The search of the items on the activity bar, with the search box and its results as the side
 * panel.
 */
export function searchActivity(projectId: string): FeatureActivity {
  return {
    id: 'search',
    label: 'Search',
    icon: <SearchIcon />,
    href: routes.project(projectId).search(),
    panel: (
      <SidePanel title="Search">
        <SearchPanel projectId={projectId} />
      </SidePanel>
    ),
  }
}
