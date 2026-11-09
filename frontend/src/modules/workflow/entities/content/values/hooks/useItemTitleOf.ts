'use client'

import { useCallback } from 'react'

import { useContentSchemas } from '../../../artifact-kinds/hooks/useArtifactKindQueries'
import type { ContentValues } from '../content-values.types'
import { itemTitle } from '../item-title.utils'

/**
 * What an item is called, as the schema of its kind names its title field: the key of the item
 * until the kinds load. The reader is stable until the kinds change, for its dependents.
 */
export function useItemTitleOf(): (item: {
  kind: string
  key: string
  content: ContentValues
}) => string {
  const schemas = useContentSchemas()
  return useCallback((item) => itemTitle(schemas.get(item.kind), item), [schemas])
}
