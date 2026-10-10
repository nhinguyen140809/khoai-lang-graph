import { MessageSquareIcon } from 'lucide-react'

import { EmptyState } from '@/components/state'

export default function Page() {
  return (
    <EmptyState
      icon={MessageSquareIcon}
      title="No thread open"
      description="Open a thread from the side panel."
    />
  )
}
