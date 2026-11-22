'use client'

import { type ReactNode, useEffect } from 'react'

import { DictationProvider, useDictationContext } from '@/shared/components/dictation'
import type { SpeechProblem } from '@/shared/lib/speech'

import { usePromptSubmit, usePromptText } from '../hooks/usePromptInput'

/** Ends the dictation as the text of the prompt is sent. */
function FinishOnSubmit() {
  const dictation = useDictationContext()
  const { addBeforeSubmit } = usePromptSubmit()
  const finish = dictation?.finish

  // What is heard so far stays in the text that is sent; the microphone is let go, and a word that
  // the browser delivers late is not written into the prompt that the send has emptied.
  useEffect(
    () => (finish === undefined ? undefined : addBeforeSubmit(finish)),
    [addBeforeSubmit, finish],
  )

  return null
}

interface PromptDictationProviderProps {
  /** Called when listening fails; what to show of it is the place's. */
  onProblem?: (problem: SpeechProblem) => void
  /** The parts of the prompt that show or follow the dictation, such as its button and its light. */
  children: ReactNode
}

/**
 * Gives a prompt its dictation: what is heard goes into the text of the prompt, and listening ends
 * as the text is sent. Put it inside the prompt around the parts that use it; a prompt without it
 * has no dictation, and the rest of the prompt does not know the difference.
 */
export function PromptDictationProvider({ onProblem, children }: PromptDictationProviderProps) {
  const { value, onValueChange } = usePromptText()

  return (
    <DictationProvider value={value} onValueChange={onValueChange} onProblem={onProblem}>
      <FinishOnSubmit />
      {children}
    </DictationProvider>
  )
}
