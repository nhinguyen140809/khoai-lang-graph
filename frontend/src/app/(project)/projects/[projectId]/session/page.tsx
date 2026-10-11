import { SessionPage } from '@/features/session'

export default async function Page({ params }: PageProps<'/projects/[projectId]/session'>) {
  const { projectId } = await params
  return <SessionPage projectId={projectId} />
}
