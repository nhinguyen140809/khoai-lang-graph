import {
  type AnswerStepsAction,
  type AnswerStepsState,
  initialAnswerStepsState,
} from '../answer-steps.reducer'

interface ActionCase {
  name: string
  state: AnswerStepsState
  action: AnswerStepsAction
  next: AnswerStepsState
}

const onSecond: AnswerStepsState = { step: 1, direction: 'left' }

export const actionCases: ActionCase[] = [
  {
    name: 'goes forward and slides the next step in from the right',
    state: initialAnswerStepsState,
    action: { type: 'goTo', to: 1, count: 3 },
    next: { step: 1, direction: 'left' },
  },
  {
    name: 'goes back and slides the step before in from the left',
    state: onSecond,
    action: { type: 'goTo', to: 0, count: 3 },
    next: { step: 0, direction: 'right' },
  },
  {
    name: 'stays on the first step when asked to go before it',
    state: initialAnswerStepsState,
    action: { type: 'goTo', to: -1, count: 3 },
    next: initialAnswerStepsState,
  },
  {
    name: 'stays on the last step when asked to go past it',
    state: { step: 2, direction: 'left' },
    action: { type: 'goTo', to: 3, count: 3 },
    next: { step: 2, direction: 'left' },
  },
  {
    name: 'keeps the way of the last move when asked for the step on show',
    state: { step: 1, direction: 'right' },
    action: { type: 'goTo', to: 1, count: 3 },
    next: { step: 1, direction: 'right' },
  },
]
