'use client'

import type { ReactNode } from 'react'

import type { SpeechProblem } from '@/shared/lib/speech'

import { DictationContext } from './DictationContext'
import { useDictation } from './hooks/useDictation'

interface DictationProviderProps {
  /** The text that dictation writes into, as the place that owns it holds it. */
  value: string
  onValueChange: (value: string) => void
  /** Called when listening fails; what to show of it is the place's. */
  onProblem?: ((problem: SpeechProblem) => void) | undefined
  /** What shows or follows the dictation, such as its button and its light. */
  children: ReactNode
}

/**
 * Gives what is under it a dictation into a text: what is heard goes after the text that was there
 * when it began. It knows nothing of the place that holds the text, such as a prompt; the place
 * says how the text is read and changed, and what to do when listening fails.
 */
export function DictationProvider({
  value,
  onValueChange,
  onProblem,
  children,
}: DictationProviderProps) {
  const dictation = useDictation({ value, onValueChange, onProblem })

  return <DictationContext value={dictation}>{children}</DictationContext>
}
