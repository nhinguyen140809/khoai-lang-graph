import { ItemPage } from '@/modules/documents/widgets/item'

/** One item of the project, in a tab of its own. */
export default async function Page({ params }: PageProps<'/projects/[projectId]/items/[itemId]'>) {
  const { projectId, itemId } = await params
  return <ItemPage projectId={projectId} itemId={itemId} />
}
