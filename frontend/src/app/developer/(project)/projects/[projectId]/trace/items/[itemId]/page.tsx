import { ItemTracePage } from '@/modules/traceability/widgets/chain'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The params are read before anything shows, so the route
// is allowed to block, as it did before.
export const instant = false

/** The chain of one item, in a tab of its own. */
export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/trace/items/[itemId]'>) {
  const { projectId, itemId } = await params
  return <ItemTracePage projectId={projectId} itemId={itemId} />
}
