import type { DictationSize } from './dictation.types'

/** The words of the dictation: what its button says, and what to tell of a failure to listen. */
export const dictationMessages = {
  dictate: 'Dictate',
  stopDictating: 'Stop',
  cancelDictating: 'Cancel dictation',
  listening: 'Listening',
  microphoneRefused:
    'The microphone is not allowed. Allow it in the settings of the browser to dictate.',
  noMicrophone: 'No microphone was found.',
  notHeard: 'The speech could not be heard. Try again.',
} as const

/**
 * The bars of the button that listens, one weight for each bar: how far it follows the voice, from
 * 0 to 1. The middle ones follow it the most, so that the bars read as a wave.
 */
export const dictationBarWeights: Record<DictationSize, readonly number[]> = {
  short: [0.6, 1, 0.8, 0.5],
  long: [0.4, 0.55, 0.7, 0.9, 1, 0.8, 0.6, 0.85, 1, 0.75, 0.9, 0.65, 0.5, 0.35],
}
