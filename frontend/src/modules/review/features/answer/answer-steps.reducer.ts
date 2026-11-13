import type { SlideDirection } from '@/shared/components/animation'

/** The state of the steps of an answer: the step on show and the way the last move slid. */
export interface AnswerStepsState {
  step: number
  /** Forward brings the next step in from the right. */
  direction: SlideDirection
}

/** A change of the steps: `goTo` shows the step at an index, among `count` steps. */
export interface AnswerStepsAction {
  type: 'goTo'
  to: number
  count: number
}

/** The state before any change: the first step. */
export const initialAnswerStepsState: AnswerStepsState = { step: 0, direction: 'left' }

/** The state of the steps after a change, for `useReducer`: a step outside the steps, or the one on show, changes nothing. */
export function applyAnswerStepsAction(
  state: AnswerStepsState,
  action: AnswerStepsAction,
): AnswerStepsState {
  const { to, count } = action
  if (to < 0 || to >= count || to === state.step) return state
  return { step: to, direction: to > state.step ? 'left' : 'right' }
}
