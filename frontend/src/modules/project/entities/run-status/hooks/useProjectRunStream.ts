import { type Run, useRunStatusEvents } from '@/modules/run/entities/@x/project'
import { useReloadThreadsIfRunStatusChanged } from '@/modules/thread/entities/@x/project'

/**
 * Follows the event stream of the latest run of a thread while the run is unfinished, so that the
 * run loads again at each event that may change its status or its stage, and the threads of its
 * project load again when the status of the run changes.
 */
export function useProjectRunStream(
  run: Pick<Run, 'id' | 'thread_id' | 'status'> | null | undefined,
) {
  const reloadThreads = useReloadThreadsIfRunStatusChanged()

  useRunStatusEvents(run, reloadThreads)
}
