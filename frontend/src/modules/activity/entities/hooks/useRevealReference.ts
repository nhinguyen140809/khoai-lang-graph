'use client'

import { useContext } from 'react'

import {
  ReferenceOpenerContext,
  ReferenceRevealerContext,
} from '../components/ReferenceOpenerProvider'
import type { ChatReference } from '../reference-opener.types'

/**
 * What offers a document or an item to the user from anywhere under the page of the chat, such as
 * a review that asks to read a document. The page opens it when it shows nothing yet and asks first
 * when it shows something else, so that the user is never taken away from what they read; a page
 * that cannot ask opens it, and a place without a page does nothing.
 */
export function useRevealReference(): (reference: ChatReference, label: string) => void {
  const revealer = useContext(ReferenceRevealerContext)
  const opener = useContext(ReferenceOpenerContext)
  return (reference, label) => {
    if (revealer !== null) revealer(reference, label)
    else opener?.(reference)
  }
}
