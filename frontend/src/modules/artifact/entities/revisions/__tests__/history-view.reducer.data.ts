import {
  type HistoryViewAction,
  type HistoryViewState,
  initialHistoryViewState,
} from '../history-view.reducer'

/** A state that a change starts from: the surface open on version 2 of 3, with the changes on. */
function openOnTwo(): HistoryViewState {
  return {
    level: 'list',
    selectedVersion: 2,
    showsChanges: true,
    seenCurrentVersion: 3,
    wasHidden: false,
  }
}

/** A state, a change, and the state after it. */
export const actionCases: {
  name: string
  state: HistoryViewState
  action: HistoryViewAction
  next: HistoryViewState
}[] = [
  {
    name: 'sees nothing change and keeps the state as it is',
    state: initialHistoryViewState(3, false),
    action: { type: 'see', currentVersion: 3, isHidden: false },
    next: initialHistoryViewState(3, false),
  },
  {
    name: 'opens onto the selected version',
    state: initialHistoryViewState(3, false),
    action: { type: 'open' },
    next: { ...initialHistoryViewState(3, false), level: 'version' },
  },
  {
    name: 'closing selects the current version again and turns the changes off',
    state: openOnTwo(),
    action: { type: 'close', currentVersion: 3 },
    next: { ...openOnTwo(), level: 'closed', selectedVersion: 3, showsChanges: false },
  },
  {
    name: 'the list opens from the stepper and folds back onto it',
    state: { ...openOnTwo(), level: 'version' },
    action: { type: 'toggleList' },
    next: openOnTwo(),
  },
  {
    name: 'stepping back folds the list onto the stepper',
    state: openOnTwo(),
    action: { type: 'stepBack', currentVersion: 3 },
    next: { ...openOnTwo(), level: 'version' },
  },
  {
    name: 'stepping back from the stepper closes, as closing does',
    state: { ...openOnTwo(), level: 'version' },
    action: { type: 'stepBack', currentVersion: 3 },
    next: { ...openOnTwo(), level: 'closed', selectedVersion: 3, showsChanges: false },
  },
  {
    name: 'a version is selected without moving the surface',
    state: { ...openOnTwo(), level: 'version' },
    action: { type: 'select', version: 1 },
    next: { ...openOnTwo(), level: 'version', selectedVersion: 1 },
  },
  {
    name: 'the changes turn on and off',
    state: { ...openOnTwo(), showsChanges: false },
    action: { type: 'setShowsChanges', showsChanges: true },
    next: openOnTwo(),
  },
  {
    name: 'a new current version is selected and keeps the level',
    state: openOnTwo(),
    action: { type: 'see', currentVersion: 4, isHidden: false },
    next: { ...openOnTwo(), seenCurrentVersion: 4, selectedVersion: 4 },
  },
  {
    name: 'turning hidden closes the surface',
    state: openOnTwo(),
    action: { type: 'see', currentVersion: 3, isHidden: true },
    next: { ...openOnTwo(), level: 'closed', wasHidden: true },
  },
  {
    name: 'turning shown leaves the surface as it is',
    state: { ...openOnTwo(), level: 'closed', wasHidden: true },
    action: { type: 'see', currentVersion: 3, isHidden: false },
    next: { ...openOnTwo(), level: 'closed' },
  },
]
