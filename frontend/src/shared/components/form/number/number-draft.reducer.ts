import { numberFromText, numberToText } from './number-input.utils'

/** The text of a number input as the user types it, held for its reducer. */
export interface NumberDraftState {
  draft: string
  /** The number the state has already seen: a new one replaces the text, unless the text already reads as it. */
  seen: number | null
}

/**
 * A change of the text of a number input: `type` keeps what the user typed, `set` shows a number
 * in full, `settle` writes the text in full, and `see` tells the state the number from outside.
 */
export type NumberDraftAction =
  | { type: 'type'; text: string }
  | { type: 'set'; next: number | null }
  | { type: 'settle' }
  | { type: 'see'; value: number | null }

/** The state before any change: the text of the number, which the state has seen. */
export function initialNumberDraftState(value: number | null): NumberDraftState {
  return { draft: numberToText(value), seen: value }
}

/** The text of a number input after a change, for `useReducer`. */
export function applyNumberDraftAction(
  state: NumberDraftState,
  action: NumberDraftAction,
): NumberDraftState {
  switch (action.type) {
    case 'type':
      return { ...state, draft: action.text }
    case 'set':
      return { ...state, draft: numberToText(action.next) }
    case 'settle':
      return { ...state, draft: numberToText(numberFromText(state.draft)) }
    case 'see': {
      // A number that changes from outside, such as a reset of the form, replaces the text,
      // unless the text already reads as that number.
      if (state.seen === action.value) return state
      return {
        seen: action.value,
        draft:
          numberFromText(state.draft) === action.value ? state.draft : numberToText(action.value),
      }
    }
  }
}
