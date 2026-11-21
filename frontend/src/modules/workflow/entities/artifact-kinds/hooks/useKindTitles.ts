'use client'

import { useMemo } from 'react'

import { useKindLooks } from './useKindLooks'

/**
 * The title of each kind of the definition, from its schema, by kind name; empty while the kinds
 * load. A screen falls back to the raw kind name for a kind it does not know.
 */
export function useKindTitles(): ReadonlyMap<string, string> {
  const kindLooks = useKindLooks()
  return useMemo(
    () => new Map(Array.from(kindLooks, ([kind, { title }]) => [kind, title])),
    [kindLooks],
  )
}
