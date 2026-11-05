'use client'

import { useMemo } from 'react'

import {
  contentFields,
  contentSchemasByKind,
  itemTitle,
  mainField,
  useArtifactKinds,
  useIssueKinds,
  useWorkflowDefinition,
} from '@/modules/workflow/entities/@x/trace'

import type { TraceItem } from '../types/chains.types'
import type { ItemLinksResult } from '../types/item-links.types'
import { itemLinkGroups, linkQuotesByItem } from '../utils/chains.utils'
import { fieldMarksOf } from '../utils/link-marks.utils'
import { useItemTrace } from './useChainQueries'

/**
 * The links of an item from it and to it, grouped by link type, each row titled, and the marks of
 * their words in its text; a union with `state`.
 */
export function useItemLinks(itemId: string): ItemLinksResult {
  const trace = useItemTrace(itemId, { direction: 'both', depth: 1 })
  const { data: definition } = useWorkflowDefinition()
  const { data: kinds } = useArtifactKinds()
  const { data: issueKinds } = useIssueKinds()

  const result = useMemo<ItemLinksResult | undefined>(() => {
    const traceData = trace.data
    if (
      traceData === undefined ||
      definition === undefined ||
      kinds === undefined ||
      issueKinds === undefined
    ) {
      return undefined
    }

    const schemas = contentSchemasByKind(kinds)
    const linkTypes = definition.link_types.map(({ key, title }) => ({ key, title }))
    const isIssue = (item: TraceItem) => issueKinds.some(({ kind }) => kind === item.kind)
    const groups = itemLinkGroups(traceData, itemId, {
      linkTypes,
      titleOf: (item) => itemTitle(schemas.get(item.kind), item),
    })
    const quotes = linkQuotesByItem(traceData).get(itemId) ?? []
    const item = traceData.items.find(({ id }) => id === itemId)
    const schema = item === undefined ? undefined : schemas.get(item.kind)
    // The fields are searched with the main field first, where the words of a quote usually sit.
    const main = schema === undefined ? undefined : mainField(schema)
    const ordered =
      main === undefined || item === undefined || schema === undefined
        ? []
        : [main, ...contentFields(schema).filter((field) => field !== main)]
    const fieldMarks = fieldMarksOf(item?.content ?? {}, quotes, { fields: ordered, isIssue })
    const rows = [...groups.outgoing, ...groups.incoming].flatMap(({ rows }) => rows)
    return {
      state: 'success',
      outgoing: groups.outgoing,
      incoming: groups.incoming,
      count: rows.length,
      fieldMarks,
      rowsByLinkId: new Map(rows.map((row) => [row.link.id, row])),
    }
  }, [trace.data, definition, kinds, issueKinds, itemId])

  if (trace.isError) return { state: 'error', retry: () => void trace.refetch() }
  if (result === undefined) return { state: 'pending' }
  return result
}
