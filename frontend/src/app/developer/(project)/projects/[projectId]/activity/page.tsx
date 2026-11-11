import { Suspense } from 'react'

import { ActivityPage } from '@/modules/activity/widgets/chat'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The params are read before anything shows, so the route
// is allowed to block, as it did before.
export const instant = false

/** The chat of the activity of a project, with its prompt. */
export default async function Page({ params }: PageProps<'/projects/[projectId]/activity'>) {
  const { projectId } = await params
  return (
    <Suspense fallback={null}>
      <ActivityPage projectId={projectId} />
    </Suspense>
  )
}
