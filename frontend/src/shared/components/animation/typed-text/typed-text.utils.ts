import { typedTextStepMs, typedTextWordMs } from './typed-text.constants'

/** The words of a text, as `TypedText` shows them: split at the spaces, and no empty word. */
export function wordsOf(text: string): string[] {
  return text.split(' ').filter((word) => word !== '')
}

/** How long a text takes to come in whole, from the start of the first word to the end of the last. */
export function typedTextMs(
  text: string,
  { step = typedTextStepMs, wordDuration = typedTextWordMs, delay = 0 } = {},
): number {
  const count = wordsOf(text).length
  return count === 0 ? 0 : delay + (count - 1) * step + wordDuration
}
