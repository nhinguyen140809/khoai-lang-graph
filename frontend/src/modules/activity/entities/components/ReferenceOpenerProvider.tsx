'use client'

import { createContext, type ReactNode } from 'react'

import type { ReferenceOpener, ReferenceRevealer } from '../reference-opener.types'

export const ReferenceOpenerContext = createContext<ReferenceOpener | null>(null)

export const ReferenceRevealerContext = createContext<ReferenceRevealer | null>(null)

interface ReferenceOpenerProviderProps {
  /** What choosing a document or an item of the chat does. */
  opener: ReferenceOpener
  /** What offering a reference does, where the page can ask before it takes the place of what is shown; the opener stands in when it is left out. */
  revealer?: ReferenceRevealer
  children: ReactNode
}

/**
 * Says what choosing a reference does in the chat under it, and what offering one does. The page
 * that places the chat gives them, since where a document opens belongs to the page, not to the
 * chat.
 */
export function ReferenceOpenerProvider({
  opener,
  revealer,
  children,
}: ReferenceOpenerProviderProps) {
  return (
    <ReferenceOpenerContext value={opener}>
      <ReferenceRevealerContext value={revealer ?? null}>{children}</ReferenceRevealerContext>
    </ReferenceOpenerContext>
  )
}
