'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { runKeys } from '@/modules/run/entities/@x/activity'
import { messageKeys, threadKeys } from '@/modules/thread/entities/@x/activity'

import { answerPollMs } from '../answers.constants'

/** While the assistant works on an answer, loads the messages, the thread and its runs again and again, so that the answer shows as it arrives. */
export function useAnswerPolling(isAnswering: boolean) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!isAnswering) return
    const timer = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.all() })
      void queryClient.invalidateQueries({ queryKey: threadKeys.all() })
      void queryClient.invalidateQueries({ queryKey: runKeys.all() })
    }, answerPollMs)
    return () => {
      clearInterval(timer)
    }
  }, [isAnswering, queryClient])
}
