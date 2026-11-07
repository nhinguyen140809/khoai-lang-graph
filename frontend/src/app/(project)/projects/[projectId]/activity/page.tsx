import { Suspense } from 'react'

import { ActivityPage } from '@/modules/activity/widgets/chat'

/** The chat of the activity of a project, with its prompt. */
export default async function Page({ params }: PageProps<'/projects/[projectId]/activity'>) {
  const { projectId } = await params
  return (
    <Suspense fallback={null}>
      <ActivityPage projectId={projectId} />
    </Suspense>
  )
}
