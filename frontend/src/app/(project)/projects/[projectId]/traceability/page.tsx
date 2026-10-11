import { TraceabilityPage } from '@/features/traceability'

export default async function Page({ params }: PageProps<'/projects/[projectId]/traceability'>) {
  const { projectId } = await params
  return <TraceabilityPage projectId={projectId} />
}
