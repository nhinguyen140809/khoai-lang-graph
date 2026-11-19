'use client'

import { useMemo } from 'react'

import type { KindLook } from '../kind-look.types'
import { isNavigable, kindSchemasByKind } from '../kind-schemas.utils'
import { useArtifactKinds } from './useArtifactKindQueries'

/**
 * How each kind of the definition reads, from its schema, by kind name; empty while the kinds load.
 * A screen falls back to the raw kind name for a kind it does not know. The map is the same until
 * the kinds change, for its dependents.
 */
export function useKindLooks(): ReadonlyMap<string, KindLook> {
  const { data: artifactKinds } = useArtifactKinds()
  return useMemo(
    () =>
      new Map(
        Array.from(kindSchemasByKind(artifactKinds), ([kind, { schema }]) => [
          kind,
          { title: schema.title, isNavigable: isNavigable(schema) },
        ]),
      ),
    [artifactKinds],
  )
}
