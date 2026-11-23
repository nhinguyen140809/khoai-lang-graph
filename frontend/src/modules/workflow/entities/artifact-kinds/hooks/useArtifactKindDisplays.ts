'use client'

import { useMemo } from 'react'

import { useLinkedKinds } from '../../link-types/hooks/useLinkedKinds'
import type { ArtifactKindDisplay } from '../artifact-kind-display.types'
import { iconOf, isNavigable, kindSchemasByKind, mediaOf } from '../kind-schemas.utils'
import { useArtifactKinds } from './useArtifactKindQueries'

/**
 * How each kind of the definition reads, from its schema and its links, by kind name; empty while
 * the kinds load. A screen falls back to the raw kind name for a kind it does not know. The map
 * is the same until the kinds or the links change, for its dependents.
 */
export function useArtifactKindDisplays(): ReadonlyMap<string, ArtifactKindDisplay> {
  const { data: artifactKinds } = useArtifactKinds()
  const linkedKinds = useLinkedKinds()
  return useMemo(
    () =>
      new Map(
        Array.from(kindSchemasByKind(artifactKinds), ([kind, { schema }]) => [
          kind,
          {
            title: schema.title,
            isNavigable: isNavigable(schema),
            isTraceable: linkedKinds === undefined || linkedKinds.has(kind),
            media: mediaOf(schema),
            icon: iconOf(schema),
          },
        ]),
      ),
    [artifactKinds, linkedKinds],
  )
}
