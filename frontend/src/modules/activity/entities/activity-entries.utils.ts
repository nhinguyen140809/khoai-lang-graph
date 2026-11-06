import type { ItemRef } from '@/modules/artifact/entities/@x/activity'
import type { Interrupt } from '@/modules/review/entities/@x/activity'
import type { WorkEntry } from '@/modules/run/entities/@x/activity'
import type { Message } from '@/modules/thread/entities/@x/activity'
import { groupBy, rankIn } from '@/shared/lib/collections'
import type { View } from '@/shared/lib/view'

import type { ActivityEntry, KindGroup } from './activity-entries.types'

// The order of the entries that share a time: a message first, then work, then a review.
const entryTypeOrder = ['message', 'work', 'review'] as const

/** What a line of work wrote, by kind of item, in the order of the first item of each kind. */
function kindGroupsOf(work: WorkEntry, kindTitles: ReadonlyMap<string, string>): KindGroup[] {
  const produced: ItemRef[] = [...work.created, ...work.changed]
  return groupBy(produced, ({ kind }) => kind).map(({ key: kind, items }) => ({
    kind,
    title: kindTitles.get(kind) ?? kind,
    created: items.filter((item) => work.created.includes(item)),
    changed: items.filter((item) => work.changed.includes(item)),
  }))
}

/**
 * The entries of a run in the order of their time: a message first, then work, then a review.
 * In the user view, a line of a stage that the user does not see is left out; the developer view
 * keeps it with its stage title null.
 */
export function runEntries(input: {
  messages: readonly Message[]
  work: readonly WorkEntry[]
  interrupts: readonly Interrupt[]
  stageTitles: ReadonlyMap<string, string>
  subjectTitles: ReadonlyMap<string, string>
  kindTitles: ReadonlyMap<string, string>
  view: View
}): ActivityEntry[] {
  const entries: ActivityEntry[] = [
    ...input.messages.map((message) => ({
      type: 'message' as const,
      id: message.id,
      time: message.created_at,
      message,
    })),
    ...input.work.map((work) => ({
      type: 'work' as const,
      id: work.id,
      time: work.startedAt,
      work,
      stageTitle: input.stageTitles.get(work.stage) ?? null,
      subjectTitle:
        work.subjectItemId === null
          ? null
          : (input.subjectTitles.get(work.subjectItemId) ?? work.subjectKey),
      kindGroups: kindGroupsOf(work, input.kindTitles),
    })),
    ...input.interrupts.map((interrupt) => ({
      type: 'review' as const,
      id: interrupt.id,
      time: interrupt.created_at,
      interrupt,
    })),
  ]

  return entries
    .filter(
      (entry) => entry.type !== 'work' || entry.stageTitle !== null || input.view === 'developer',
    )
    .toSorted(
      (first, second) =>
        first.time.localeCompare(second.time) ||
        rankIn(entryTypeOrder, first.type) - rankIn(entryTypeOrder, second.type),
    )
}

/** The messages of a thread by the run they belong to, in order; `null` holds those of no run. */
export function messagesByRun(messages: readonly Message[]): ReadonlyMap<string | null, Message[]> {
  const byRun = new Map<string | null, Message[]>()
  for (const message of messages) {
    const run = message.run_id
    const held = byRun.get(run)
    if (held === undefined) byRun.set(run, [message])
    else held.push(message)
  }
  return byRun
}

/** The anchor of an entry in the chat. */
export function entryAnchorId(entryId: string): string {
  return `entry-${entryId}`
}
