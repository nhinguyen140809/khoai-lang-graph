import {
  initialNumberDraftState,
  type NumberDraftAction,
  type NumberDraftState,
} from '../number-draft.reducer'

/** A state that a change starts from: the text on the way to six, seen as five. */
function onTheWay(): NumberDraftState {
  return { draft: '6.', seen: 5 }
}

/** A state, a change, and the state after it. */
export const actionCases: {
  name: string
  state: NumberDraftState
  action: NumberDraftAction
  next: NumberDraftState
}[] = [
  {
    name: 'sees the number it starts with and keeps the state as it is',
    state: initialNumberDraftState(1.5),
    action: { type: 'see', value: 1.5 },
    next: initialNumberDraftState(1.5),
  },
  {
    name: 'keeps what the user typed',
    state: initialNumberDraftState(null),
    action: { type: 'type', text: '6.' },
    next: { draft: '6.', seen: null },
  },
  {
    name: 'shows a number that is set in full',
    state: initialNumberDraftState(null),
    action: { type: 'set', next: 3.5 },
    next: { draft: '3.5', seen: null },
  },
  {
    name: 'writes the text in full when it settles',
    state: onTheWay(),
    action: { type: 'settle' },
    next: { draft: '6', seen: 5 },
  },
  {
    name: 'empties a text that holds no number when it settles',
    state: { draft: '-', seen: null },
    action: { type: 'settle' },
    next: { draft: '', seen: null },
  },
  {
    name: 'a number from outside replaces the text',
    state: { draft: '5', seen: 5 },
    action: { type: 'see', value: null },
    next: { draft: '', seen: null },
  },
  {
    name: 'a number from outside keeps the text that already reads as it',
    state: onTheWay(),
    action: { type: 'see', value: 6 },
    next: { draft: '6.', seen: 6 },
  },
]
