'use client'

import { useRef } from 'react'

import { ErrorState, LoadingState } from '@/shared/components/state'

import { activityChatMessages } from '../activity-chat.constants'
import type { OlderRuns as OlderRunsLoad } from '../chat-state.types'
import { useLoadOlderRuns } from '../hooks/useLoadOlderRuns'

interface OlderRunsProps {
  olderRuns: OlderRunsLoad
  /** The oldest run that the chat shows now. */
  firstRunId: string | null
}

/**
 * The top of the chat: it asks for the runs before the first one when the reader comes near it,
 * and shows their load, or why they did not load, in their place.
 */
export function OlderRuns({ olderRuns, firstRunId }: OlderRunsProps) {
  const marker = useRef<HTMLDivElement>(null)
  useLoadOlderRuns(marker, olderRuns, firstRunId)

  return (
    <div ref={marker} data-slot="older-runs">
      {olderRuns.isLoading && (
        <LoadingState size="compact" rows={3} label={activityChatMessages.olderLoading} />
      )}
      {olderRuns.isError && (
        <ErrorState
          size="compact"
          message={activityChatMessages.olderError}
          onRetry={olderRuns.load}
        />
      )}
    </div>
  )
}
