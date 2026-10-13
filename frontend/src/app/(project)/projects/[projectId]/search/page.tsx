import { SearchIcon } from 'lucide-react'

import { EmptyState } from '@/shared/components/state'

export default function Page() {
  return (
    <EmptyState
      icon={SearchIcon}
      title="Search the items of the project"
      description="Type a key such as REQ-001, or a few words of an item, in the search box. Choose a result to open it in a new tab."
    />
  )
}
