import { type AttentionLevel, reviewStatus } from '@/modules/artifact/entities/@x/trace'
import { isOpenIssue, type IssueKind } from '@/modules/workflow/entities/@x/trace'

import type { TraceItem } from '../chains/chains.types'
import type { TraceLink } from '../links/trace-links.types'
import { isLinkOutOfDate } from '../links/trace-links.utils'
import { attentionMessages } from './attention.constants'
import type { AttentionContext, AttentionItem, ItemAttention } from './trace-graph.types'

/**
 * The gaps that ask the user to act now, and not only to follow, by their key.
 *
 * TODO: a gap should carry its own level of attention, so that no key of a gap is written here and
 * a gap that a later definition adds is placed without a change of this file.
 */
export const actGapKeys = ['needs_review'] as const

/** Whether a gap asks the user to act now, and not only to follow. */
export function isActGap(key: string): boolean {
  return (actGapKeys as readonly string[]).includes(key)
}

/**
 * How much a link asks of the user, not whether it is good or bad: act, it was made from a version
 * of its target that changed since; quiet, one of its ends was rejected or replaced; follow, it
 * comes from an open issue; none, it needs nothing. The first rule that holds decides, in this
 * order.
 */
export function linkAttention(
  link: TraceLink,
  ends: { source: TraceItem; target: TraceItem },
  issueKinds: readonly IssueKind[],
): AttentionLevel {
  if (isLinkOutOfDate(link, ends.target)) return 'act'
  const isQuiet =
    ends.source.review_status === reviewStatus.rejected ||
    ends.source.review_status === reviewStatus.superseded ||
    ends.target.review_status === reviewStatus.rejected ||
    ends.target.review_status === reviewStatus.superseded
  if (isQuiet) return 'quiet'
  if (isOpenIssue(ends.source, issueKinds)) return 'follow'
  return 'none'
}

/**
 * How much an item asks of the user, with the reasons in words for its tooltip: act, a gap that
 * asks the user to act now holds it, or an open issue is about it; follow, another gap holds it,
 * or it is itself an open issue; quiet, it was rejected or replaced; none otherwise. The first
 * rule that holds decides, in this order.
 */
export function itemAttention(item: AttentionItem, context: AttentionContext): ItemAttention {
  const gaps = context.gapsOfItem.get(item.id) ?? []
  const issueReasons = context.issueReasonsOfItem.get(item.id) ?? []
  const actReasons = [
    ...gaps.filter(({ key }) => isActGap(key)).map(({ description }) => description),
    ...issueReasons,
  ]
  if (actReasons.length > 0) return { level: 'act', reasons: actReasons }

  const followReasons = [
    ...gaps.filter(({ key }) => !isActGap(key)).map(({ description }) => description),
    ...(context.openIssueIds.has(item.id) ? [attentionMessages.openIssue] : []),
  ]
  if (followReasons.length > 0) return { level: 'follow', reasons: followReasons }

  if (item.review_status === reviewStatus.rejected) {
    return { level: 'quiet', reasons: [attentionMessages.rejected] }
  }
  if (item.review_status === reviewStatus.superseded) {
    return { level: 'quiet', reasons: [attentionMessages.replaced] }
  }
  return { level: 'none', reasons: [] }
}
