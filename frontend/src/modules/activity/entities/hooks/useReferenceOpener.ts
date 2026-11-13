'use client'

import { useContext } from 'react'

import { ReferenceOpenerContext } from '../components/ReferenceOpenerProvider'
import type { ChatReference } from '../reference-opener.types'

/**
 * What opens one reference of the chat, for the control that shows it; null where the page gives
 * no opener, and the reference only reads.
 */
export function useReferenceOpener(reference: ChatReference): (() => void) | null {
  const openReference = useContext(ReferenceOpenerContext)
  if (openReference === null) return null
  return () => {
    openReference(reference)
  }
}
