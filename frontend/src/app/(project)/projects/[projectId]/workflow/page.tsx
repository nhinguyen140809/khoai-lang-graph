import { WorkflowHome } from '@/features/workflow'

export default async function Page({ params }: PageProps<'/projects/[projectId]/workflow'>) {
  const { projectId } = await params
  return <WorkflowHome projectId={projectId} />
}
