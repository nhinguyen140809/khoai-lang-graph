'use client'

import { ErrorBoundary } from 'react-error-boundary'

import { activityChatMessages } from '../activity-chat.constants'
import { EntryView, type EntryViewProps } from './EntryView'

/** An entry of the chat that fails to show on its own, without taking the rest of the chat with it. */
export function ChatEntry(props: EntryViewProps) {
  return (
    <ErrorBoundary
      fallback={<p className="text-sm text-destructive">{activityChatMessages.entryError}</p>}
      resetKeys={[props.entry]}
    >
      <EntryView {...props} />
    </ErrorBoundary>
  )
}
