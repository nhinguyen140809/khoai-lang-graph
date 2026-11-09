'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  type ArtifactItem,
  itemsPageSize,
  listProjectItems,
} from '@/modules/artifact/entities/@x/trace'
import {
  fieldText,
  mainField,
  useContentSchemas,
  useIssueKinds,
  useIssueLinkTypes,
} from '@/modules/workflow/entities/@x/trace'
import { collectAllPages } from '@/shared/api/request'

import { traceLinksPageSize } from '../../links/page-sizes.constants'
import { listProjectTraceLinks } from '../../links/trace-links.api'
import type { TraceLink } from '../../links/trace-links.types'
import type { LiveTraceOptions } from '../../live-trace.types'
import { issueKeys } from '../issues.keys'
import type { OpenIssuesResult } from '../open-issues.types'
import { openIssueEntries } from '../open-issues.utils'

/** Every item of a project and every current link of it, read once, in parallel. */
async function projectItemsAndLinks(
  projectId: string,
): Promise<{ items: ArtifactItem[]; links: TraceLink[] }> {
  const [items, links] = await Promise.all([
    collectAllPages((cursor) => listProjectItems(projectId, cursor, itemsPageSize)),
    collectAllPages((cursor) => listProjectTraceLinks(projectId, cursor, traceLinksPageSize)),
  ])
  return { items, links }
}

/** The pending answer of `useOpenIssues`, the same object while its query loads. */
const pendingIssues: OpenIssuesResult = { state: 'pending' }

/**
 * The open issues of a project, grouped by their kind, each with its problem, the items it is
 * about with the words they are quoted, and the people it involves; a union with `state`.
 */
export function useOpenIssues(
  projectId: string,
  { refetchInterval }: LiveTraceOptions = {},
): OpenIssuesResult {
  const query = useQuery({
    queryKey: issueKeys.ofProject(projectId),
    queryFn: () => projectItemsAndLinks(projectId),
    refetchInterval: refetchInterval ?? false,
  })
  const kinds = useIssueKinds()
  const linkTypes = useIssueLinkTypes()
  const schemas = useContentSchemas()

  const result = useMemo<OpenIssuesResult | undefined>(() => {
    const items = query.data?.items
    const links = query.data?.links
    const linkTypesByKind = linkTypes.data
    if (items === undefined || links === undefined || kinds.data === undefined) return undefined
    if (linkTypesByKind === undefined) return undefined
    const groups = openIssueEntries(items, links, {
      issueKinds: kinds.data,
      linkTypesOf: (kind) => linkTypesByKind.get(kind) ?? { about: [], parties: [] },
      kindTitleOf: (kind) => schemas.get(kind)?.title ?? kind,
      mainTextOf: (item) => {
        const schema = schemas.get(item.kind)
        const field = schema === undefined ? undefined : mainField(schema)
        return field === undefined ? '' : (fieldText(item, field.name) ?? '')
      },
    })
    return {
      state: 'success',
      groups,
      count: groups.reduce((count, { entries }) => count + entries.length, 0),
      artifactByItem: new Map(items.map((item) => [item.id, item.artifact_id])),
      items,
    }
  }, [query.data, kinds.data, linkTypes.data, schemas])

  if (query.isError)
    return { state: 'error', error: query.error, retry: () => void query.refetch() }
  if (result === undefined) return pendingIssues
  return result
}
