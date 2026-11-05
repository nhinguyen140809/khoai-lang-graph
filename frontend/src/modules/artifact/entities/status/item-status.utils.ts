import { isOpenIssue, type IssueKind } from '@/modules/workflow/entities/@x/artifact'
import { assertPresent } from '@/shared/lib/guards'
import type { View } from '@/shared/lib/view'

import type { ArtifactItem, OutlineItem } from '../items/items.types'
import { attentionLevels, itemStatusLooks, itemStatusMessages } from './item-status.constants'
import type { AttentionLevel, ItemStatus, StatusCount } from './item-status.types'

/**
 * The status an item shows, the first that holds: an open issue still to settle; edited, when the
 * user changed it and no review has seen the change; else its review status. A superseded item
 * never reaches a screen, so it reads as a draft.
 */
export function itemStatus(
  item: Pick<ArtifactItem, 'id' | 'kind' | 'content' | 'review_status' | 'updated_by'>,
  issueKinds: readonly IssueKind[],
  { outOfDateIds }: { outOfDateIds: ReadonlySet<string> } = { outOfDateIds: new Set() },
): ItemStatus {
  if (isOpenIssue(item, issueKinds)) return 'openIssue'
  if (outOfDateIds.has(item.id)) return 'outOfDate'
  if (item.updated_by.actor === 'user' && item.review_status === 'draft') return 'edited'
  return item.review_status === 'superseded' ? 'draft' : item.review_status
}

/**
 * How much an item status asks of the user now. A draft, an open issue or an out of date item asks
 * to act while its document waits for the review of the user; outside a review the agents work on
 * the first two, and an out of date item stays one to follow.
 */
export function attentionLevel(
  status: ItemStatus,
  { isUnderReview }: { isUnderReview: boolean },
): AttentionLevel {
  switch (status) {
    case 'draft':
    case 'openIssue':
      return isUnderReview ? 'act' : 'none'
    case 'edited':
      return 'follow'
    case 'outOfDate':
      return isUnderReview ? 'act' : 'follow'
    case 'rejected':
      return 'quiet'
    case 'approved':
      return 'none'
  }
}

/**
 * How an item status shows in a document that is, or is not, under review: how much it asks of the
 * user (`level`), the color for that (`color`, null for the text color), the letter at the end of its
 * row (null when the color alone says it), and its label in the view given.
 */
export function itemStatusLook(
  status: ItemStatus,
  { isUnderReview }: { isUnderReview: boolean },
  view: View,
) {
  const look = itemStatusLooks[status]
  const level = attentionLevel(status, { isUnderReview })
  const isDraftInReview = status === 'draft' && isUnderReview
  // An open issue shows its letter only where the user can act on it.
  const letter = status === 'openIssue' && level !== 'act' ? null : look.letter
  return {
    level,
    color: attentionLevels[level].color,
    letter,
    label: isDraftInReview ? itemStatusMessages.statuses.draftInReview.label : look.label[view],
  }
}

/** The level of the rows given, the one that asks most; `none` without rows. */
export function highestLevel(levels: readonly AttentionLevel[]): AttentionLevel {
  if (levels.length === 0) return 'none'
  return levels.reduce<AttentionLevel>(
    (highest, level) =>
      attentionLevels[level].order < attentionLevels[highest].order ? level : highest,
    'quiet',
  )
}

/** The counts of the lists given added up by status, in the order the statuses first appear. */
export function mergeStatusCounts(lists: readonly (readonly StatusCount[])[]): StatusCount[] {
  const merged = new Map<ItemStatus, number>()
  for (const { status, count } of lists.flat()) {
    merged.set(status, (merged.get(status) ?? 0) + count)
  }
  return Array.from(merged, ([status, count]) => ({ status, count }))
}

/**
 * The counts of the statuses that need the attention of the user, in the order of the levels `act`
 * then `follow`, each with its level; the other statuses are left out.
 */
export function askingCounts(
  counts: readonly StatusCount[],
  options: { isUnderReview: boolean },
): (StatusCount & { level: AttentionLevel })[] {
  return counts
    .flatMap(({ status, count }) => {
      const level = attentionLevel(status, options)
      return level === 'act' || level === 'follow' ? [{ status, level, count }] : []
    })
    .toSorted((a, b) => attentionLevels[a.level].order - attentionLevels[b.level].order)
}

/**
 * How many items have each status that needs the attention of the user (see `askingCounts`), with
 * the first item of each in the given order.
 */
export function attentionCounts(
  statuses: readonly { item: OutlineItem; status: ItemStatus }[],
  options: { isUnderReview: boolean },
): { status: ItemStatus; level: AttentionLevel; count: number; first: OutlineItem }[] {
  const counts = mergeStatusCounts(statuses.map(({ status }) => [{ status, count: 1 }]))
  return askingCounts(counts, options).map((asking) => ({
    ...asking,
    first: assertPresent(
      statuses.find(({ status }) => status === asking.status),
      'A counted status has an item',
    ).item,
  }))
}

/**
 * What the rows under a section or a group ask of the user: the level of the one that asks most,
 * and the words for those that ask something, such as "3 to review, 1 to resolve"; empty when none does.
 */
export function branchAttention(
  counts: readonly StatusCount[],
  options: { isUnderReview: boolean },
): { level: AttentionLevel; text: string } {
  return {
    level: highestLevel(counts.map(({ status }) => attentionLevel(status, options))),
    text: askingCounts(counts, options)
      .map(({ status, count }) => attentionText(status, count))
      .join(', '),
  }
}

/** The words for a count of items in a state that asks something of the user, such as "3 to review". */
export function attentionText(status: ItemStatus, count: number): string {
  if (status === 'openIssue') return itemStatusMessages.attention.openIssue(count)
  if (status === 'edited') return itemStatusMessages.attention.edited(count)
  if (status === 'outOfDate') return itemStatusMessages.attention.outOfDate(count)
  return itemStatusMessages.attention.draft(count)
}
