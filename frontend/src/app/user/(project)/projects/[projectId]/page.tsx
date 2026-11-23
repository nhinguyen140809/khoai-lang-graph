import { Suspense } from 'react'

import { ActivityChat } from '@/modules/activity/widgets/chat'
import { ReaderSplit } from '@/modules/documents/widgets/reader'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a page that is visited
// again shows its state as it was left. The params are read before anything shows, so the route
// is allowed to block.
export const instant = false

/**
 * The chat of a project, with its prompt. A document or an item that the chat names opens,
 * read-only, beside the chat on a wide screen and over it on a narrow one.
 */
export default async function Page({ params }: PageProps<'/user/projects/[projectId]'>) {
  const { projectId } = await params
  return (
    <Suspense fallback={null}>
      <ReaderSplit projectId={projectId}>
        <ActivityChat projectId={projectId} />
      </ReaderSplit>
    </Suspense>
  )
}
