import type { Run } from '@/modules/run/entities/@x/project'
import type { Thread } from '@/modules/thread/entities/@x/project'

/**
 * The run that the status of a project shows, null before its first run, with the threads of the
 * project. Not an answer of the API: `useProjectRun` builds it from the threads and their runs.
 */
export type ProjectRun =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; run: Run | null; threads: Thread[] }
