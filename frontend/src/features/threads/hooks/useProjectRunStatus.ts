import { pickStatusThread, unfinishedThreads } from '../run-status.utils'
import type { Run, Thread } from '../threads.types'
import { useProjectThreads } from './useProjectThreads'
import { useRun } from './useRun'
import { useThreadRuns } from './useThreadRuns'

export type ProjectRunStatus =
  | { state: 'loading' }
  | { state: 'error'; message: string; retry: () => void }
  | { state: 'empty' }
  | {
      state: 'ready'
      run: Run
      /** The threads of the unfinished runs of the project other than `run`, most urgent first. */
      others: Thread[]
    }

/**
 * The run that the status bar of a project shows: the unfinished run that needs the user most
 * or, when no run is unfinished, the latest run of the thread with the newest message.
 */
export function useProjectRunStatus(projectId: string): ProjectRunStatus {
  const threads = useProjectThreads(projectId)
  const statusThread = threads.data === undefined ? undefined : pickStatusThread(threads.data)
  const activeRun = useRun(statusThread?.active_run_id)
  // Without an unfinished run, the runs of the thread with the newest message; the first is the
  // latest.
  const fallbackThreadId = statusThread === undefined ? threads.data?.[0]?.id : undefined
  const threadRuns = useThreadRuns(fallbackThreadId)

  if (threads.isPending) return { state: 'loading' }
  if (threads.isError) {
    return { state: 'error', message: threads.error.message, retry: () => void threads.refetch() }
  }

  if (statusThread !== undefined) {
    if (activeRun.isPending) return { state: 'loading' }
    if (activeRun.isError) {
      return {
        state: 'error',
        message: activeRun.error.message,
        retry: () => void activeRun.refetch(),
      }
    }
    const others = unfinishedThreads(threads.data).filter(({ id }) => id !== statusThread.id)
    return { state: 'ready', run: activeRun.data, others }
  }

  if (fallbackThreadId === undefined) return { state: 'empty' }
  if (threadRuns.isPending) return { state: 'loading' }
  if (threadRuns.isError) {
    return {
      state: 'error',
      message: threadRuns.error.message,
      retry: () => void threadRuns.refetch(),
    }
  }
  const latest = threadRuns.data[0]
  return latest === undefined ? { state: 'empty' } : { state: 'ready', run: latest, others: [] }
}
