import { ActivityIcon } from 'lucide-react'

import { EmptyState } from '@/shared/components/state'

// TODO: replace with the activity of the project once it is built.
export default function Page() {
  return (
    <EmptyState
      icon={ActivityIcon}
      title="Activity is not built yet"
      description="The work of the agents and the messages of the project will show here."
    />
  )
}
