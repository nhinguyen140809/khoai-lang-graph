import type { Tone } from '@/shared/lib/tone'
import type { Wording } from '@/shared/lib/view'

import type { ChangeReason } from './revisions.types'

/**
 * The label of each change reason in each view: why one version of an artifact or an item
 * exists, as the history of a record reads it.
 */
export const changeReasonLabels = {
  generated: { developer: 'Generated', user: 'Written by the agents' },
  user_edit: { developer: 'User edit', user: 'Your edit' },
  rework: { developer: 'Rework', user: 'Reworked' },
  reviewed: { developer: 'Reviewed', user: 'Approved in a review' },
  restored: { developer: 'Restored', user: 'Restored' },
  deleted: { developer: 'Deleted', user: 'Deleted' },
} as const satisfies Record<ChangeReason, Wording>

/** How a change reason shows. */
interface ChangeReasonLook {
  /** The color of the reason text: what the agents made reads in the yellow, what the user made in the primary, and the ends in their status colors. */
  color: Tone
}

/**
 * The color of each change reason, as the history of a record reads it. The reasons are a fixed
 * enum of the app, like the run statuses, and no part of the workflow definition, so their look
 * sits in one record next to their words.
 */
export const changeReasonLooks = {
  generated: { color: 'chart' },
  user_edit: { color: 'primary' },
  rework: { color: 'warning' },
  reviewed: { color: 'success' },
  restored: { color: 'primary' },
  deleted: { color: 'destructive' },
} as const satisfies Record<ChangeReason, ChangeReasonLook>

/** How many versions a page of the history of a record holds; the next page loads on demand. */
export const revisionsPageSize = 50

export const revisionMessages = {
  title: 'History',
  minimize: 'Minimize the history',
  showAll: 'Show all versions',
  collapse: 'Collapse',
  newer: 'Newer version',
  older: 'Older version',
  version: (version: number) => `Version ${String(version)}`,
  byAuthor: (author: string) => `by ${author}`,
  you: 'You',
  theAgents: 'The agents',
  showChanges: 'Show changes',
  firstVersion: 'Version 1 is the first one.',
  changed: 'Changed',
  noChange: 'The content did not change.',
  showOlder: 'Show older versions',
  moreActions: 'More actions',
  itemsAsNow: 'The items below are as they are now; each item has its own history.',
  loading: 'Loading the versions',
  loadError: 'The versions could not load.',
} as const

// The words of a change of a record that the state of the project refuses. One concept, one place:
// the edit and restore features take their `locked` value from it, since `artifact` may not read
// `documents`, where the rule itself lives.
export const recordChangeMessages = {
  locked: 'This document cannot change now. It can change while it waits for your review.',
} as const

/** The motion of the stepper when it moves to another version: a slide of half the content. */
export const versionSwap = { distance: 0.5, duration: 300 }

/** The motion of the surface when it moves between the list and the stepper: a short slide. */
export const levelSwap = { distance: 0.15, duration: 300 }
