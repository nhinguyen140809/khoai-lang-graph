'use client'

import { useReducer } from 'react'

import { applyHistoryViewAction, initialHistoryViewState } from '../history-view.reducer'
import type { HistoryView } from '../revisions.types'

/**
 * The state of the history surface of a record: closed at the start; closing selects the current
 * version again; a new current version is selected and keeps the level, so the surface stays open
 * with the new version on top of the list after a restore; `isHidden` closes it, so a form never
 * meets a shown version.
 */
export function useHistoryView(
  currentVersion: number,
  { isHidden }: { isHidden: boolean },
): HistoryView {
  const [state, dispatch] = useReducer(
    applyHistoryViewAction,
    initialHistoryViewState(currentVersion, isHidden),
  )

  // The state is put right during the render that sees a new current version or the surface
  // turning hidden, with nothing else in between.
  if (state.seenCurrentVersion !== currentVersion || state.wasHidden !== isHidden) {
    dispatch({ type: 'see', currentVersion, isHidden })
  }

  return {
    level: state.level,
    selectedVersion: state.selectedVersion,
    showsChanges: state.showsChanges,
    open: () => {
      dispatch({ type: 'open' })
    },
    close: () => {
      dispatch({ type: 'close', currentVersion })
    },
    toggleList: () => {
      dispatch({ type: 'toggleList' })
    },
    stepBack: () => {
      dispatch({ type: 'stepBack', currentVersion })
    },
    select: (version: number) => {
      dispatch({ type: 'select', version })
    },
    setShowsChanges: (showsChanges: boolean) => {
      dispatch({ type: 'setShowsChanges', showsChanges })
    },
  }
}
