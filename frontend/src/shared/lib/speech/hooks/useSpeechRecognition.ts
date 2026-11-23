'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import type { SpeechProblem, SpeechRecognitionLike } from '../speech.types'
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  speechProblemOf,
  transcriptOf,
} from '../speech-recognition.utils'

interface UseSpeechRecognitionOptions {
  /** Gets all that was heard since listening began, as one text, again each time it changes. */
  onTranscript: (text: string) => void
  /** Called when listening fails, such as when the user refuses the microphone. */
  onProblem?: (problem: SpeechProblem) => void
  /** The language to listen for, such as `vi-VN`; the one of the browser by default. */
  lang?: string
}

const subscribeToNothing = () => () => undefined

/**
 * Listens to the microphone and turns speech into text. The browser asks the user for the
 * microphone the first time `start` runs; a refusal goes to `onProblem`. `stop` ends listening and
 * keeps what was heard, `cancel` ends it and says nothing more. Nothing is supported on the server
 * or in a browser without speech recognition, and `isSupported` says so.
 */
export function useSpeechRecognition({
  onTranscript,
  onProblem,
  lang,
}: UseSpeechRecognitionOptions) {
  // The browser is only known on the client, so the server and the first render agree on false.
  const isSupported = useSyncExternalStore(
    subscribeToNothing,
    isSpeechRecognitionSupported,
    () => false,
  )
  const [isListening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  const onProblemRef = useRef(onProblem)
  useEffect(() => {
    onTranscriptRef.current = onTranscript
    onProblemRef.current = onProblem
  })

  const release = useCallback(() => {
    const recognition = recognitionRef.current
    if (recognition === null) return
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    recognitionRef.current = null
  }, [])

  const start = useCallback(() => {
    if (recognitionRef.current !== null) return
    const recognition = createSpeechRecognition(lang)
    if (recognition === null) return
    recognition.onresult = (event) => {
      onTranscriptRef.current(transcriptOf(event.results))
    }
    recognition.onerror = (event) => {
      // Nothing was said for a while: the browser ends listening by itself, which is no failure.
      if (event.error === 'no-speech' || event.error === 'aborted') return
      onProblemRef.current?.(speechProblemOf(event.error))
    }
    recognition.onend = () => {
      release()
      setListening(false)
    }
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }, [lang, release])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const cancel = useCallback(() => {
    const recognition = recognitionRef.current
    release()
    setListening(false)
    recognition?.abort()
  }, [release])

  // Leaving the page ends listening, so that the microphone is not held.
  useEffect(() => cancel, [cancel])

  return { isSupported, isListening, start, stop, cancel }
}
