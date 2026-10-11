import { ConsolePage } from '@/features/console'

export default async function Page({ params }: PageProps<'/projects/[projectId]/console'>) {
  const { projectId } = await params
  return <ConsolePage projectId={projectId} />
}
