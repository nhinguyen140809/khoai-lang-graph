// The hooks of the store of the prompt of the project list: the one that asks the prompt to take
// the focus, which the commands that start a project call, and the one that the prompt calls to
// take it.

import { useRouter } from 'next/navigation'
import { type RefObject, useEffect } from 'react'

import { routes } from '@/shared/routes'

import { useProjectPromptStore } from '../project-prompt.store'

/** Opens the project list with the focus in its prompt, where a project starts from an idea. */
export function useOpenProjectPrompt() {
  const router = useRouter()
  const requestPromptFocus = useProjectPromptStore((state) => state.requestFocus)

  return () => {
    requestPromptFocus()
    router.push(routes.projects())
  }
}

/**
 * Focuses the box of the prompt of the project list when `useOpenProjectPrompt` asks for it, such
 * as from the command that creates a project, then clears the request.
 */
export function useProjectPromptFocus(inputRef: RefObject<HTMLTextAreaElement | null>) {
  const focusRequested = useProjectPromptStore((state) => state.focusRequested)
  const focused = useProjectPromptStore((state) => state.focused)

  useEffect(() => {
    if (!focusRequested) return
    inputRef.current?.focus()
    focused()
  }, [focusRequested, focused, inputRef])
}
