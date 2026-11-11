import { GapPage } from '@/modules/traceability/widgets/gap'

// Pages are kept, hidden, when the user leaves them (Cache Components), so a tab that is visited
// again shows its state as it was left. The params are read before anything shows, so the route
// is allowed to block, as it did before.
export const instant = false

/** The items of one gap of the coverage, in a tab named after the gap. */
export default async function Page({
  params,
}: PageProps<'/projects/[projectId]/trace/gaps/[gapKey]'>) {
  const { projectId, gapKey } = await params
  return <GapPage projectId={projectId} gapKey={gapKey} />
}
