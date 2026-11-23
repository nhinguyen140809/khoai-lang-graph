'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'

import { type SpeechProblem, useSpeechRecognition, useVoiceLevel } from '@/shared/lib/speech'

import { dictatedText } from '../dictated-text.utils'

interface UseDictationOptions {
  /** The text that dictation writes into. */
  value: string
  onValueChange: (value: string) => void
  /** Called when listening fails, such as a microphone that is refused; what to show is the caller's. */
  onProblem?: ((problem: SpeechProblem) => void) | undefined
}

/**
 * Dictation into a text: what is heard goes after the text that was there when it began, as it is
 * heard. Stopping keeps it; cancelling puts the text back as it was. It also gives the level of the
 * voice as it is heard. It knows nothing of the prompt that it writes into.
 */
export function useDictation({ value, onValueChange, onProblem }: UseDictationOptions) {
  const baseRef = useRef('')
  // The text and what changes it are kept in a ref, so that the controls below are the same
  // functions from one render to the next.
  const latest = useRef({ value, onValueChange })
  useEffect(() => {
    latest.current = { value, onValueChange }
  })
  const speech = useSpeechRecognition({
    onTranscript: (heard) => {
      latest.current.onValueChange(dictatedText(baseRef.current, heard))
    },
    onProblem: (problem) => {
      onProblem?.(problem)
    },
  })

  // The level of the voice, for what moves with it while the prompt listens.
  const { level, isMetered } = useVoiceLevel(speech.isListening)
  const { isSupported, isListening, start: startListening, stop, cancel: stopListening } = speech

  const start = useCallback(() => {
    baseRef.current = latest.current.value
    startListening()
  }, [startListening])

  const cancel = useCallback(() => {
    stopListening()
    latest.current.onValueChange(baseRef.current)
  }, [stopListening])

  return useMemo(
    () => ({
      level,
      isMetered,
      isSupported,
      isListening,
      start,
      stop,
      /** Ends listening and drops what the browser still delivers, such as when the text is sent and what is heard after it belongs to no text. */
      finish: stopListening,
      cancel,
    }),
    [level, isMetered, isSupported, isListening, start, stop, stopListening, cancel],
  )
}
