'use client'

import { useReducer } from 'react'

import { applyFilterAction } from '../filter.reducer'
import type { FilterField, FilterValues } from '../filter.types'

/**
 * The values that the user chooses in the filters before applying them, so that the list changes
 * only once they are applied. `reset` starts again from the values applied.
 */
export function useFilterDraft(applied: FilterValues) {
  const [draft, dispatch] = useReducer(applyFilterAction, applied)

  return {
    values: draft,
    toggle: (field: FilterField, value: string) => {
      dispatch({ type: 'toggle', field, value })
    },
    clear: () => {
      dispatch({ type: 'clear' })
    },
    reset: () => {
      dispatch({ type: 'set', values: applied })
    },
  }
}
