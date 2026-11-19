// The hooks of the store of the prompt where a project starts: the one that asks the prompt to take
// the focus, which the commands that start a project call, and the one that the prompt calls to
// take it.

import { useRouter } from 'next/navigation'
import { type RefObject, useEffect } from 'react'

import { useProjectPages } from '@/modules/project/entities'

import { useProjectPromptStore } from '../project-prompt.store'

/**
 * Opens the page where a project starts, in the frame on show, with the focus in its prompt, where
 * a project starts from an idea.
 */
export function useOpenProjectPrompt() {
  const router = useRouter()
  const pages = useProjectPages()
  const requestPromptFocus = useProjectPromptStore((state) => state.requestFocus)

  return () => {
    requestPromptFocus()
    router.push(pages.start())
  }
}

/**
 * Focuses the box of the prompt where a project starts when `useOpenProjectPrompt` asks for it, such
 * as from the command that creates a project, then clears the request.
 */
export function useProjectPromptFocus(inputRef: RefObject<HTMLTextAreaElement | null>) {
  const isFocusRequested = useProjectPromptStore((state) => state.focusRequested)
  const focused = useProjectPromptStore((state) => state.focused)

  useEffect(() => {
    if (!isFocusRequested) return
    inputRef.current?.focus()
    focused()
  }, [isFocusRequested, focused, inputRef])
}
