'use client'

import { itemKindsByArtifactKind } from '../workflow-definition.utils'
import { useDefinitionQuery } from './useDefinitionQuery'

/**
 * The kinds of item that each kind of artifact holds, in the order of the definition, by the kind
 * of the artifact. The map in `data` is undefined while the definition loads; a reader that orders
 * the items by these kinds waits for it, so nothing draws in an order it would change.
 */
export function useArtifactItemKinds() {
  return useDefinitionQuery(undefined, itemKindsByArtifactKind)
}
