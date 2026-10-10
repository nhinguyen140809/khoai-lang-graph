import { GitForkIcon } from 'lucide-react'

import { EmptyState } from '@/components/state'

export default function Page() {
  return (
    <EmptyState
      icon={GitForkIcon}
      title="Traceability is not built yet"
      description="The traceability matrix and the coverage come in a later version."
    />
  )
}
