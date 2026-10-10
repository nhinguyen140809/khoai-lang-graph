import { FileStackIcon } from 'lucide-react'

import { EmptyState } from '@/components/state'

export default function Page() {
  return (
    <EmptyState
      icon={FileStackIcon}
      title="Artifacts are not built yet"
      description="The explorer of artifacts and items, the item view and the documents come in a later version."
    />
  )
}
