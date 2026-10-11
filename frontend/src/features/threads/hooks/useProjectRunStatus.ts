import type { Run } from '../threads.types'
import { useProjectThreads } from './useProjectThreads'
import { useRun } from './useRun'
import { useThreadRuns } from './useThreadRuns'

export type ProjectRunStatus =
  | { state: 'loading' }
  | { state: 'error'; message: string; retry: () => void }
  | { state: 'empty' }
  | { state: 'ready'; run: Run }

/** The thread of the session of the project; with one session, the first thread is it. */
function sessionThread(threads: ReturnType<typeof useProjectThreads>['data']) {
  // A thread with an unfinished run comes first, so the status bar follows the run that needs
  // the user most even if the API one day returns more than one.
  return threads?.find(({ active_run_status }) => active_run_status !== null) ?? threads?.at(0)
}

/**
 * The run that the status bar of a project shows: the unfinished run of the session, or,
 * when no run is unfinished, the latest run.
 */
export function useProjectRunStatus(projectId: string): ProjectRunStatus {
  const threads = useProjectThreads(projectId)
  const thread = sessionThread(threads.data)
  const activeRun = useRun(thread?.active_run_id)
  // The runs of the thread, for the latest run when no run is unfinished.
  const threadRuns = useThreadRuns(thread?.id)

  if (threads.isPending) return { state: 'loading' }
  if (threads.isError) {
    return { state: 'error', message: threads.error.message, retry: () => void threads.refetch() }
  }
  if (thread === undefined) return { state: 'empty' }

  if (thread.active_run_id !== null) {
    if (activeRun.isPending) return { state: 'loading' }
    if (activeRun.isError) {
      return {
        state: 'error',
        message: activeRun.error.message,
        retry: () => void activeRun.refetch(),
      }
    }
    return { state: 'ready', run: activeRun.data }
  }

  if (threadRuns.isPending) return { state: 'loading' }
  if (threadRuns.isError) {
    return {
      state: 'error',
      message: threadRuns.error.message,
      retry: () => void threadRuns.refetch(),
    }
  }
  const latest = threadRuns.data.at(0)
  return latest === undefined ? { state: 'empty' } : { state: 'ready', run: latest }
}
