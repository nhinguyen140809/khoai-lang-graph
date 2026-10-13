import { SearchIcon } from 'lucide-react'

import type { FeatureActivity } from '@/components/layout'
import { SidePanel } from '@/components/layout'
import { searchHref } from '@/lib/routes.utils'

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
    href: searchHref(projectId),
    panel: (
      <SidePanel title="Search">
        <SearchPanel projectId={projectId} />
      </SidePanel>
    ),
  }
}
