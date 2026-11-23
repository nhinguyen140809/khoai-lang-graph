/** Whether the browser can read a text aloud. */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

interface SpeakOptions {
  /** The language of the voice, such as `vi-VN`; the one of the browser by default. */
  lang?: string | undefined
  /** Called when the reading ends, whether it ran out, was stopped or failed. */
  onEnd: () => void
}

/**
 * Reads a text aloud with a voice of the browser, in place of any reading that is going on. The
 * browser reads long texts in one go, with no cost to the app and no data sent by it.
 */
export function speak(text: string, { lang, onEnd }: SpeakOptions): void {
  if (!isSpeechSynthesisSupported()) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang ?? navigator.language
  utterance.onend = onEnd
  utterance.onerror = onEnd
  // A reading that was going on ends first, and tells its owner so.
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

/** Stops the reading that is going on, if any. */
export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel()
}
