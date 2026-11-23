'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { isSpeechSynthesisSupported, speak, stopSpeaking } from '../speech-synthesis.utils'

const subscribeToNothing = () => () => undefined

/**
 * Reads texts aloud with the voice of the browser. `isSpeaking` holds while the text of this use is
 * read: another reading, which takes the voice, ends it. Leaving the page ends the reading. Nothing
 * is supported on the server or in a browser without it, and `isSupported` says so.
 */
export function useSpeechSynthesis() {
  const isSupported = useSyncExternalStore(
    subscribeToNothing,
    isSpeechSynthesisSupported,
    () => false,
  )
  const [isSpeaking, setSpeaking] = useState(false)
  // Whether the voice is reading the text of this use: another use that takes the voice ends it.
  const isOwnerRef = useRef(false)

  const read = useCallback((text: string, lang?: string) => {
    isOwnerRef.current = true
    setSpeaking(true)
    speak(text, {
      lang,
      onEnd: () => {
        isOwnerRef.current = false
        setSpeaking(false)
      },
    })
  }, [])

  const stop = useCallback(() => {
    stopSpeaking()
    setSpeaking(false)
  }, [])

  // A reading that this use started does not go on after the page is left. Only the use that still
  // owns the voice stops it: one whose reading another took over must not cut off that one.
  useEffect(
    () => () => {
      if (isOwnerRef.current) stopSpeaking()
    },
    [],
  )

  return { isSupported, isSpeaking, read, stop }
}
