import { ItemTracePage } from '@/modules/traceability/widgets/chain'

/** The chain of one item, in a tab of its own. */
export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/trace/items/[itemId]'>) {
  const { projectId, itemId } = await params
  return <ItemTracePage projectId={projectId} itemId={itemId} />
}
