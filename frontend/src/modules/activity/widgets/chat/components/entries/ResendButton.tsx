'use client'

import { RotateCcwIcon } from 'lucide-react'

import type { Thread } from '@/modules/thread/entities'
import { useSendMessage } from '@/modules/thread/features/send-message'
import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'

interface ResendButtonProps {
  content: string
  projectId: string
  thread: Thread
  display?: 'label' | 'icon'
}

/**
 * The button that sends a message of the user again: its words never reached the agents, because
 * the run they were meant for ended first. Sending them again starts a new run.
 */
export function ResendButton({ content, projectId, thread, display = 'label' }: ResendButtonProps) {
  const { send, isPending } = useSendMessage({ projectId, thread })

  return (
    <Button
      type="button"
      variant="ghost"
      size={display === 'icon' ? 'icon-xs' : 'xs'}
      aria-label={display === 'icon' ? 'Send it again' : undefined}
      disabled={isPending}
      onClick={() => {
        send(content, { runConfig: undefined, onSent: () => undefined })
      }}
    >
      {isPending ? <Spinner aria-hidden /> : <RotateCcwIcon aria-hidden />}
      {display === 'label' && 'Try again'}
    </Button>
  )
}
