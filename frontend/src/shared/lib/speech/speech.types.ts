/** One alternative of what was heard. */
interface SpeechAlternative {
  transcript: string
}

/** One stretch of speech: its best alternative, and whether the browser is done with it. */
export interface SpeechResult {
  isFinal: boolean
  0: SpeechAlternative
}

/** What the browser reports as it listens. */
export interface SpeechResultEvent {
  results: ArrayLike<SpeechResult>
}

/** What the browser reports when it cannot listen, such as `not-allowed` for a microphone the user refused. */
export interface SpeechErrorEvent {
  error: string
}

/** The part of the speech recognition of the browser (the Web Speech API) that the app uses. */
export interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  /** Stops listening and still reports what was heard. */
  stop: () => void
  /** Stops listening and drops what was heard. */
  abort: () => void
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
}

/** Why listening could not start or went on: the microphone is refused, or the browser could not hear. */
export type SpeechProblem = 'not-allowed' | 'no-microphone' | 'other'
