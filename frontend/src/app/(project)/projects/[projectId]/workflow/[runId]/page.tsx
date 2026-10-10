import { NetworkIcon } from 'lucide-react'

import { EmptyState } from '@/components/state'

export default function Page() {
  return (
    <EmptyState
      icon={NetworkIcon}
      title="The run view is not built yet"
      description="The graph of the run, the state of each node and the steps come in a later version."
    />
  )
}
