'use client'

import { useReloadRunInterrupts } from '@/modules/review/entities/@x/activity'
import { type Run, useRunProgressEvents } from '@/modules/run/entities/@x/activity'
import { useReloadRunSteps } from '@/modules/run/entities/@x/activity'
import { useReloadThreadMessages } from '@/modules/thread/entities/@x/activity'

/**
 * Loads the work, the reviews and the messages again as the latest run of the thread goes on, at
 * each event that changes what the run did. The run itself loads again through the polls and the
 * stream that the status bar already follows.
 */
export function useActivityStream(run: Run | null | undefined, threadId: string): void {
  const reloadSteps = useReloadRunSteps()
  const reloadInterrupts = useReloadRunInterrupts()
  const reloadMessages = useReloadThreadMessages()

  useRunProgressEvents(run, async () => {
    const runId = run?.id
    if (runId === undefined) return
    await Promise.all([reloadSteps(runId), reloadInterrupts(runId), reloadMessages(threadId)])
  })
}
