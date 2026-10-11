import { NetworkIcon } from 'lucide-react'

import { EmptyState } from '@/components/state'

export default function Page() {
  return (
    <EmptyState
      icon={NetworkIcon}
      title="Choose a run"
      description="The panel lists the runs of the project; a click opens the run: its header, its error if it failed, and the timeline of its steps."
    />
  )
}
