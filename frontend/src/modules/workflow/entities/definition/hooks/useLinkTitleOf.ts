'use client'

import { useCallback, useMemo } from 'react'

import { useWorkflowDefinition } from './useWorkflowDefinition'

/**
 * The title of a link type, by its key, as the definition of the workflow names it: the key itself
 * until the definition loads. The titles are built once, and the reader is stable for its
 * dependents.
 */
export function useLinkTitleOf(): (linkType: string) => string {
  const { data: definition } = useWorkflowDefinition()
  const linkTitles = useMemo(
    () => new Map((definition?.link_types ?? []).map(({ key, title }) => [key, title])),
    [definition],
  )
  return useCallback((linkType: string) => linkTitles.get(linkType) ?? linkType, [linkTitles])
}
