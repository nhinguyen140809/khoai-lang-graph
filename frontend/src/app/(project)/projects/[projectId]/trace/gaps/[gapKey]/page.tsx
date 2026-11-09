import { GapPage } from '@/modules/traceability/widgets/gap'

/** The items of one gap of the coverage, in a tab named after the gap. */
export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/trace/gaps/[gapKey]'>) {
  const { projectId, gapKey } = await params
  return <GapPage projectId={projectId} gapKey={gapKey} />
}
