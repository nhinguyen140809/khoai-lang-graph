'use client'

import { useMemo } from 'react'

import { kindSchemasByKind } from '../kind-schemas.utils'
import { useArtifactKinds } from './useArtifactKindQueries'

/**
 * The title of each kind of the definition, from its schema, by kind name; empty while the kinds
 * load. A screen falls back to the raw kind name for a kind it does not know.
 */
export function useKindTitles(): ReadonlyMap<string, string> {
  const { data: artifactKinds } = useArtifactKinds()
  return useMemo(() => {
    const titles = new Map<string, string>()
    for (const { kind, schema } of kindSchemasByKind(artifactKinds).values()) {
      titles.set(kind, schema.title)
    }
    return titles
  }, [artifactKinds])
}
