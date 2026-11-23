'use client'

import { useDefinitionQuery } from '../../definition/hooks/useDefinitionQuery'
import { linkedKindsOf } from '../link-types.utils'

/** The kinds that some link type of the current workflow lists; undefined while the definition loads. */
export function useLinkedKinds(): ReadonlySet<string> | undefined {
  return useDefinitionQuery(undefined, linkedKindsOf).data
}
