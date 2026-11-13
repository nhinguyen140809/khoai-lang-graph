'use client'

import type { KeyboardEvent, ReactNode } from 'react'
import { createContext } from 'react'

/**
 * What the box of feedback inside an option holds: the words written so far, the change of them,
 * and the keys that send the answer from the box. Only the option that is chosen shows the box,
 * so the rows of options read these through the hook instead of a prop that each layer passes on.
 */
export interface FeedbackBoxContextValue {
  feedback: string
  onFeedback: (text: string) => void
  onFeedbackKey: (event: KeyboardEvent) => void
}

export const FeedbackBoxContext = createContext<FeedbackBoxContextValue | undefined>(undefined)

/** Provides the feedback of the answer to the options under it. */
export function FeedbackBoxProvider({
  value,
  children,
}: {
  value: FeedbackBoxContextValue
  children: ReactNode
}) {
  return <FeedbackBoxContext.Provider value={value}>{children}</FeedbackBoxContext.Provider>
}
