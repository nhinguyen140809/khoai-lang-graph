import { useQuery } from '@tanstack/react-query'

import { listProjectRuns } from '../workflow.api'

const ACTIVE = new Set(['queued', 'running', 'interrupted'])

/** The runs of a project; they are read again while one of them runs. */
export function useProjectRuns(projectId: string) {
  return useQuery({
    queryKey: ['workflow', 'runs', projectId],
    queryFn: () => listProjectRuns(projectId),
    refetchInterval: (query) =>
      query.state.data?.some(({ status }) => ACTIVE.has(status)) === true ? 3000 : false,
  })
}
