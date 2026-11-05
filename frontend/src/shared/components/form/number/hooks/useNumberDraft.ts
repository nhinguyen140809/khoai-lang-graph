import { useReducer } from 'react'

import { applyNumberDraftAction, initialNumberDraftState } from '../number-draft.reducer'
import type { NumberTextOptions } from '../number-input.types'
import { numberFromText, sanitizeNumberText } from '../number-input.utils'

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
  const [state, dispatch] = useReducer(applyNumberDraftAction, initialNumberDraftState(value))

  // The state is put right during the render that sees a new number, with nothing else in between.
  if (state.seen !== value) {
    dispatch({ type: 'see', value })
  }

  return {
    draft: state.draft,
    /** The user typed `text`: the draft keeps what a number may hold, and the number follows. */
    type: (text: string) => {
      const kept = sanitizeNumberText(text, options)
      dispatch({ type: 'type', text: kept })
      onValueChange(numberFromText(kept))
    },
    /** The number is set to `next`, such as by a step: the draft shows it in full. */
    set: (next: number | null) => {
      dispatch({ type: 'set', next })
      onValueChange(next)
    },
    /** The user left the input: the draft is written in full ("1." as "1"). */
    settle: () => {
      dispatch({ type: 'settle' })
    },
  }
}
