'use client'

import { isUnfinishedRunStatus } from '@/modules/run/entities'
import type { SentMessage } from '@/modules/thread/entities'

import { useAnswersStore } from '../stores/answers.store'

/**
 * What a page does when a message it sent is taken in: the run that answers it is watched, so that
 * what the answer asks for is done when the answer arrives. A message that went to the work of the
 * project has no answer to watch.
 */
export function useWatchAnswer() {
  const watch = useAnswersStore((state) => state.watch)
  return ({ message, run }: SentMessage) => {
    if (isUnfinishedRunStatus(run.status)) watch(run.id, message.thread_id)
  }
}
