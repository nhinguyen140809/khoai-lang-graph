'use client'

import { useCallback } from 'react'

import { linkTypeTitles } from '../workflow-definition.utils'
import { useDefinitionQuery } from './useDefinitionQuery'

/**
 * The title of a link type, by its key, as the definition of the workflow names it: the key itself
 * until the definition loads. The titles are built once, and the reader is stable for its
 * dependents.
 */
export function useLinkTitleOf(): (linkType: string) => string {
  const titles = useDefinitionQuery(undefined, linkTypeTitles)
  return useCallback((linkType) => titles.data?.get(linkType) ?? linkType, [titles.data])
}
