import type { ReviewStatus } from '../artifacts/artifacts.types'

/** The status an item shows: its review status, `edited` by the user, an `openIssue` still to settle, or `outOfDate` when it was made from an older version of an item it links to. */
export type ItemStatus = Exclude<ReviewStatus, 'superseded'> | 'edited' | 'openIssue' | 'outOfDate'

/**
 * How much a row asks of the user now: `act` is to act now, `follow` is a change that a review will
 * see, `none` is nothing to do and `quiet` is set aside.
 */
export type AttentionLevel = 'act' | 'follow' | 'none' | 'quiet'

/** How many items have a status, for the statuses that appear. */
export interface StatusCount {
  status: ItemStatus
  count: number
}
