import { useState } from 'react'

import type { NumberTextOptions } from '../number-input.types'
import { numberFromText, numberToText, sanitizeNumberText } from '../number-input.utils'

/**
 * The text of a number input as the user types it ("1." on the way to "1.5"), kept beside the
 * number it reads as. A number that changes from outside, such as a reset of the form, replaces the
 * text, unless the text already reads as that number.
 */
export function useNumberDraft(
  value: number | null,
  onValueChange: (value: number | null) => void,
  options: NumberTextOptions,
) {
  const [draft, setDraft] = useState(() => numberToText(value))
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (numberFromText(draft) !== value) setDraft(numberToText(value))
  }

  return {
    draft,
    /** The user typed `text`: the draft keeps what a number may hold, and the number follows. */
    type: (text: string) => {
      const kept = sanitizeNumberText(text, options)
      setDraft(kept)
      onValueChange(numberFromText(kept))
    },
    /** The number is set to `next`, such as by a step: the draft shows it in full. */
    set: (next: number | null) => {
      setDraft(numberToText(next))
      onValueChange(next)
    },
    /** The user left the input: the draft is written in full ("1." as "1"). */
    settle: () => {
      setDraft(numberToText(numberFromText(draft)))
    },
  }
}
