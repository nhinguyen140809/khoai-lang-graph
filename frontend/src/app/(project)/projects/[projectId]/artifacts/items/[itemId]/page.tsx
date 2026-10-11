import { ItemPage } from '@/features/artifacts'

export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/artifacts/items/[itemId]'>) {
  const { projectId, itemId } = await params
  return <ItemPage projectId={projectId} itemId={itemId} />
}
