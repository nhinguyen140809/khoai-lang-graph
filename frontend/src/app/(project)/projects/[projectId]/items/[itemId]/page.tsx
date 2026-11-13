import { ItemPage } from '@/modules/documents/widgets/item'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The params are read before anything shows, so the route
// is allowed to block, as it did before.
export const instant = false

/** One item of the project, in a tab of its own. */
export default async function Page({ params }: PageProps<'/projects/[projectId]/items/[itemId]'>) {
  const { projectId, itemId } = await params
  return <ItemPage projectId={projectId} itemId={itemId} />
}
