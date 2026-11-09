'use client'

import { useMemo } from 'react'

import {
  contentDisplayOf,
  kindSchemasByKind,
  useArtifactKinds,
} from '@/modules/workflow/entities/@x/artifact'

import type { KindView } from '../outline.types'

/**
 * The view of every kind of item and of artifact, by kind, built once from the kinds that loaded:
 * the title, the display and the schema of each, as the outline of a document reads them. Undefined
 * while the kinds load.
 */
export function useKindViews(): ReadonlyMap<string, KindView> | undefined {
  const kinds = useArtifactKinds()
  return useMemo(() => {
    if (kinds.data === undefined) return undefined
    const views = new Map<string, KindView>()
    for (const [kind, { schema }] of kindSchemasByKind(kinds.data)) {
      views.set(kind, { title: schema.title, display: contentDisplayOf(schema), schema })
    }
    return views
  }, [kinds.data])
}
