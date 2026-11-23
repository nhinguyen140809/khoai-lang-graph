'use client'

import { useCallback } from 'react'

import { useBeforeUnload } from '@/shared/lib/unload'

import { usePromptDraftStore } from '../prompt-draft.store'

/**
 * The text of a prompt that is kept while the app is open, so that leaving the page and coming
 * back does not lose it: it is there again when the prompt shows with the same `name`, and a prompt
 * with another name has its own. A reload or closing the tab would lose it, so the browser asks
 * before it does while there is text. Setting a blank text forgets the draft.
 */
export function usePromptDraft(name: string): [string, (text: string) => void] {
  const text = usePromptDraftStore((state) => state.drafts[name] ?? '')
  const setDraft = usePromptDraftStore((state) => state.setDraft)
  useBeforeUnload(text !== '')

  return [
    text,
    useCallback(
      (next: string) => {
        setDraft(name, next)
      },
      [name, setDraft],
    ),
  ]
}
