// The hooks that read the threads. The runs of a thread have their own file, useRunQueries.ts.

import { useQuery } from '@tanstack/react-query'

import { listProjectThreads } from '../threads.api'
import { threadKeys } from '../threads.keys'

/** The threads of a project, the latest message first. */
export function useProjectThreads(projectId: string) {
  return useQuery({
    queryKey: threadKeys.ofProject(projectId),
    queryFn: () => listProjectThreads(projectId),
  })
}
