import type { HistoryLevel } from './revisions.types'

/** The state of the history surface of one record, held for its reducer. */
export interface HistoryViewState {
  level: HistoryLevel
  selectedVersion: number
  showsChanges: boolean
  /** The current version the state has already seen: a new one is selected and keeps the level. */
  seenCurrentVersion: number
  /** Whether the surface was already hidden: turning hidden closes it. */
  wasHidden: boolean
}

/**
 * A change of the state of the history surface: `open` shows the selected version, `close` closes
 * it, `toggleList` opens or folds the list of every version, `stepBack` folds the list and closes
 * the stepper, `select` picks a version, `setShowsChanges` turns the changes on or off, and `see`
 * tells the state what the record now is.
 */
export type HistoryViewAction =
  | { type: 'open' }
  | { type: 'close'; currentVersion: number }
  | { type: 'toggleList' }
  | { type: 'stepBack'; currentVersion: number }
  | { type: 'select'; version: number }
  | { type: 'setShowsChanges'; showsChanges: boolean }
  | { type: 'see'; currentVersion: number; isHidden: boolean }

/** The state before any change: closed, on the current version of the record. */
export function initialHistoryViewState(
  currentVersion: number,
  isHidden: boolean,
): HistoryViewState {
  return {
    level: 'closed',
    selectedVersion: currentVersion,
    showsChanges: false,
    seenCurrentVersion: currentVersion,
    wasHidden: isHidden,
  }
}

/** The state of the closed surface: the current version is selected again and the changes are off. */
function closed(state: HistoryViewState, currentVersion: number): HistoryViewState {
  return { ...state, level: 'closed', selectedVersion: currentVersion, showsChanges: false }
}

/** The state of the history surface after a change, for `useReducer`. */
export function applyHistoryViewAction(
  state: HistoryViewState,
  action: HistoryViewAction,
): HistoryViewState {
  switch (action.type) {
    case 'open':
      return { ...state, level: 'version' }
    case 'close':
      return closed(state, action.currentVersion)
    case 'toggleList':
      return { ...state, level: state.level === 'list' ? 'version' : 'list' }
    case 'stepBack':
      // Escape steps the list down to the stepper; from the stepper it closes, as Close does.
      return state.level === 'list'
        ? { ...state, level: 'version' }
        : closed(state, action.currentVersion)
    case 'select':
      return { ...state, selectedVersion: action.version }
    case 'setShowsChanges':
      return { ...state, showsChanges: action.showsChanges }
    case 'see': {
      // A new current version (a restore, a save) is selected and keeps the level; the edit mode
      // closes the surface.
      let next = state
      if (next.seenCurrentVersion !== action.currentVersion) {
        next = {
          ...next,
          seenCurrentVersion: action.currentVersion,
          selectedVersion: action.currentVersion,
        }
      }
      if (action.isHidden && !next.wasHidden) next = { ...next, level: 'closed' }
      return next.wasHidden === action.isHidden ? next : { ...next, wasHidden: action.isHidden }
    }
  }
}
