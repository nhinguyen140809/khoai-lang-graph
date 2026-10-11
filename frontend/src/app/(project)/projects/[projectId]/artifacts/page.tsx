import { FileStackIcon } from 'lucide-react'

import { EmptyState } from '@/components/state'

export default function Page() {
  return (
    <EmptyState
      icon={FileStackIcon}
      title="Choose an artifact"
      description="The tree shows every artifact of the project with its items; a click opens the artifact as a document."
    />
  )
}
