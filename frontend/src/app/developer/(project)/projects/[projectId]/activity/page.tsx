import { Suspense } from 'react'

import { ActivityChat } from '@/modules/activity/widgets/chat'
import { ActivityTab } from '@/modules/activity/widgets/tab'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The params are read before anything shows, so the route
// is allowed to block, as it did before.
export const instant = false

/** The chat of the activity of a project, with its prompt. */
export default async function Page({
  params,
}: PageProps<'/developer/projects/[projectId]/activity'>) {
  const { projectId } = await params
  return (
    <Suspense fallback={null}>
      <ActivityTab projectId={projectId}>
        <ActivityChat projectId={projectId} />
      </ActivityTab>
    </Suspense>
  )
}
