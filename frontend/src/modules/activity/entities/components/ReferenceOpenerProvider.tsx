'use client'

import { createContext, type ReactNode } from 'react'

import type { ReferenceOpener } from '../reference-opener.types'

export const ReferenceOpenerContext = createContext<ReferenceOpener | null>(null)

interface ReferenceOpenerProviderProps {
  /** What choosing a document or an item of the chat does. */
  opener: ReferenceOpener
  children: ReactNode
}

/**
 * Says what choosing a reference does in the chat under it. The page that places the chat gives
 * it, since where a document opens belongs to the page, not to the chat.
 */
export function ReferenceOpenerProvider({ opener, children }: ReferenceOpenerProviderProps) {
  return <ReferenceOpenerContext value={opener}>{children}</ReferenceOpenerContext>
}
