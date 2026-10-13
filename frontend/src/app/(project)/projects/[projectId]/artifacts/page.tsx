import { FileStackIcon } from 'lucide-react'

import { EmptyState } from '@/shared/components/state'

export default function Page() {
  return (
    <EmptyState
      icon={FileStackIcon}
      title="Open an artifact or an item"
      description="Choose one in the tree to read it here. An item opens with its trace and its versions."
    />
  )
}
