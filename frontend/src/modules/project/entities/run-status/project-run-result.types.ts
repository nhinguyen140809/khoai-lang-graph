import type { Run } from '@/modules/run/entities/@x/project'
import type { Thread } from '@/modules/thread/entities/@x/project'

/**
 * The run that the status of a project shows, null before its first run, with the threads of the
 * project from the one that needs the user most. Not an answer of the API: `useProjectRunResult`
 * builds it from the threads and their latest runs.
 */
export type ProjectRunResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; run: Run | null; threads: Thread[] }
