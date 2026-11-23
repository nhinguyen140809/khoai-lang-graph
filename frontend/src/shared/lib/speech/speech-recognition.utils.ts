import type { SpeechProblem, SpeechRecognitionLike, SpeechResult } from './speech.types'

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

/** The speech recognition of the browser, with the prefix that Chrome and Safari still use; none where there is none. */
function speechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

/** Whether the browser can turn speech into text. */
export function isSpeechRecognitionSupported(): boolean {
  return speechRecognitionConstructor() !== null
}

/** A recognition set to listen on and on, and to report words before they are final; null where the browser has none. */
export function createSpeechRecognition(lang?: string): SpeechRecognitionLike | null {
  const Recognition = speechRecognitionConstructor()
  if (Recognition === null) return null
  const recognition = new Recognition()
  recognition.lang = lang ?? navigator.language
  recognition.continuous = true
  recognition.interimResults = true
  return recognition
}

/** All that was heard so far, as one text, the words not yet final included. */
export function transcriptOf(results: ArrayLike<SpeechResult>): string {
  return Array.from(results, (result) => result[0].transcript)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The problem that an error of the browser means. */
export function speechProblemOf(error: string): SpeechProblem {
  if (error === 'not-allowed' || error === 'service-not-allowed') return 'not-allowed'
  if (error === 'audio-capture') return 'no-microphone'
  return 'other'
}
