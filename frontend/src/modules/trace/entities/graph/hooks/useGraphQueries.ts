'use client'

import { useMemo } from 'react'

import { attentionLevels } from '@/modules/artifact/entities/@x/trace'
import {
  useIssueKinds,
  useItemTitleOf,
  useKindTitles,
  useLinkTitleOf,
} from '@/modules/workflow/entities/@x/trace'
import { isNotFoundError } from '@/shared/api/error'
import { assertPresent } from '@/shared/lib/guards'

import { useItemTrace } from '../../chains/hooks/useChainQueries'
import { useOpenIssues } from '../../issues/hooks/useOpenIssues'
import type { LiveTraceOptions } from '../../live-trace.types'
import { useTraceabilityCoverage } from '../../traceability/hooks/useTraceabilityQueries'
import { attentionMessages } from '../attention.constants'
import { isActGap, itemAttention } from '../attention.utils'
import { chainDepth } from '../trace-graph.constants'
import type {
  AttentionContext,
  AttentionItem,
  ItemAttention,
  ItemChainResult,
  TraceAttentionResult,
} from '../trace-graph.types'
import { chainGraphOf } from '../trace-graph.utils'

/** The pending answer of `useTraceAttention`, the same object while its queries load. */
const pendingAttention: TraceAttentionResult = { state: 'pending' }

/**
 * The attention of the items of a project, as `itemAttention` tells it: the gaps of the coverage
 * that hold each item, and the open issues about it or that it is; a union with `state`. The items
 * of a document count theirs through the outlines, which hold full items.
 */
export function useTraceAttention(
  projectId: string,
  options: LiveTraceOptions = {},
): TraceAttentionResult {
  const coverage = useTraceabilityCoverage(projectId, options)
  const issues = useOpenIssues(projectId, options)

  const context = useMemo<AttentionContext | undefined>(() => {
    if (coverage.data === undefined || issues.state !== 'success') return undefined
    const gapsOfItem = new Map<string, { key: string; description: string }[]>()
    for (const gap of coverage.data.gaps) {
      for (const item of gap.items) {
        const gaps = gapsOfItem.get(item.item_id) ?? []
        gaps.push({ key: gap.key, description: gap.description })
        gapsOfItem.set(item.item_id, gaps)
      }
    }
    const issueReasonsOfItem = new Map<string, string[]>()
    const openIssueIds = new Set<string>()
    for (const group of issues.groups) {
      for (const { issue, subjects } of group.entries) {
        openIssueIds.add(issue.id)
        for (const { item } of subjects) {
          const reasons = issueReasonsOfItem.get(item.id) ?? []
          reasons.push(attentionMessages.concerns(group.kindTitle))
          issueReasonsOfItem.set(item.id, reasons)
        }
      }
    }
    return { gapsOfItem, issueReasonsOfItem, openIssueIds }
  }, [coverage.data, issues])

  const attentionOf = useMemo(
    () =>
      context === undefined
        ? undefined
        : (item: AttentionItem): ItemAttention => itemAttention(item, context),
    [context],
  )

  const attentionByArtifact = useMemo(() => {
    if (coverage.data === undefined || issues.state !== 'success' || attentionOf === undefined) {
      return undefined
    }
    const byArtifact = new Map<string, ItemAttention>()
    const bump = (artifactId: string, next: ItemAttention) => {
      const current = byArtifact.get(artifactId)
      if (
        current === undefined ||
        attentionLevels[next.level].order < attentionLevels[current.level].order
      ) {
        byArtifact.set(artifactId, next)
        return
      }
      if (attentionLevels[next.level].order === attentionLevels[current.level].order) {
        byArtifact.set(artifactId, {
          level: current.level,
          reasons: [...new Set([...current.reasons, ...next.reasons])],
        })
      }
    }
    // The items of the gaps, which the coverage lists with their ids only: the document takes the
    // level of the gap, act for the gaps that ask the user to act now, follow for the others.
    for (const gap of coverage.data.gaps) {
      const level = isActGap(gap.key) ? 'act' : 'follow'
      const attention: ItemAttention = { level, reasons: [gap.description] }
      for (const item of gap.items) {
        const artifactId = issues.artifactByItem.get(item.item_id)
        if (artifactId !== undefined) bump(artifactId, attention)
      }
    }
    // The open issues: each issue asks the user to follow it, and the items it is about to act.
    for (const group of issues.groups) {
      for (const { issue, subjects } of group.entries) {
        bump(issue.artifact_id, attentionOf(issue))
        for (const { item } of subjects) bump(item.artifact_id, attentionOf(item))
      }
    }
    return byArtifact
  }, [coverage.data, issues, attentionOf])

  const result = useMemo<TraceAttentionResult | undefined>(
    () =>
      attentionOf === undefined || attentionByArtifact === undefined
        ? undefined
        : { state: 'success', attentionOf, attentionByArtifact },
    [attentionOf, attentionByArtifact],
  )

  if (coverage.isError) {
    return { state: 'error', error: coverage.error, retry: () => void coverage.refetch() }
  }
  if (issues.state === 'error') return issues
  if (result === undefined) return pendingAttention
  return result
}

/**
 * The chain of one item as a graph: both walks of its trace, the items named by their kind and
 * their title, the links with the title of their type and the words they quote, and the attention
 * of each; a union with `state`.
 */
export function useItemChain(
  projectId: string,
  itemId: string,
  options: LiveTraceOptions = {},
): ItemChainResult {
  const trace = useItemTrace(itemId, { direction: 'both', depth: chainDepth }, options)
  const kinds = useIssueKinds()
  const titleOf = useItemTitleOf()
  const kindTitles = useKindTitles()
  const linkTitleOf = useLinkTitleOf()
  const attention = useTraceAttention(projectId, options)

  const result = useMemo<ItemChainResult | undefined>(() => {
    if (trace.data === undefined || kinds.data === undefined) return undefined
    if (attention.state !== 'success') return undefined
    const graph = chainGraphOf(trace.data, {
      focusId: itemId,
      issueKinds: kinds.data,
      titleOf,
      kindTitleOf: (item) => kindTitles.get(item.kind) ?? item.kind,
      linkTitleOf,
      attentionOf: attention.attentionOf,
    })
    return {
      state: 'success',
      graph,
      focus: assertPresent(
        graph.nodes.find((node) => node.id === itemId),
        'The trace of an item holds the item itself',
      ),
    }
  }, [trace.data, kinds.data, titleOf, kindTitles, linkTitleOf, attention, itemId])

  if (trace.isError) {
    if (isNotFoundError(trace.error)) return { state: 'notFound' }
    return { state: 'error', error: trace.error, retry: () => void trace.refetch() }
  }
  // The chain needs the attention of its items and the kinds of the definition as much as its own
  // trace: an error of either leaves the page with its way to try again, not a load without end.
  if (attention.state === 'error') return attention
  if (kinds.isError) {
    return { state: 'error', error: kinds.error, retry: () => void kinds.refetch() }
  }
  if (result === undefined) return { state: 'pending' }
  return result
}
