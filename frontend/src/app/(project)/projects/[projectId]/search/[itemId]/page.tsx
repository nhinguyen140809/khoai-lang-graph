import { ItemPage } from '@/features/search'

export default async function Page({ params }: PageProps<'/projects/[projectId]/search/[itemId]'>) {
  const { projectId, itemId } = await params
  return <ItemPage projectId={projectId} itemId={itemId} />
}
