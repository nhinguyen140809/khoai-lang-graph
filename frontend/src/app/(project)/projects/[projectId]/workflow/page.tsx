import { NetworkIcon } from 'lucide-react'

import { EmptyState } from '@/components/state'

export default function Page() {
  return (
    <EmptyState
      icon={NetworkIcon}
      title="Workflow is not built yet"
      description="The runs, their steps and the graph of the workflow come in a later version."
    />
  )
}
