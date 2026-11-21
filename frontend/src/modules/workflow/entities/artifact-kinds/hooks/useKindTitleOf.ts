'use client'

import { useCallback } from 'react'

import { useKindTitles } from './useKindTitles'

/**
 * The title of a kind, as the schema of the definition names it: the kind itself for one the
 * definition does not have, and while the kinds load. The reader is stable until the kinds change,
 * for its dependents.
 */
export function useKindTitleOf(): (kind: string) => string {
  const kindTitles = useKindTitles()
  return useCallback((kind) => kindTitles.get(kind) ?? kind, [kindTitles])
}
