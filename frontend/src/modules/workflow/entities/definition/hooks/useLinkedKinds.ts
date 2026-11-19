'use client'

import { linkedKindsOf } from '../link-types.utils'
import { useDefinitionQuery } from './useDefinitionQuery'

/** The kinds that some link type of the current workflow lists; undefined while the definition loads. */
export function useLinkedKinds(): ReadonlySet<string> | undefined {
  return useDefinitionQuery(undefined, linkedKindsOf).data
}
