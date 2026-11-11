import type { ItemRef } from '@/modules/artifact/entities/@x/activity'
import type { Interrupt } from '@/modules/review/entities/@x/activity'
import { phaseItems, splitWork, type WorkEntry } from '@/modules/run/entities/@x/activity'
import type { Message } from '@/modules/thread/entities/@x/activity'
import { groupBy } from '@/shared/lib/collections'
import type { View } from '@/shared/lib/view'

import type { ActivityEntry, KindGroup } from './activity-entries.types'

// The order of the entries that share a time: a message first, then work, then a review. The
// separator of a phase and its items share a rank, so that they keep the order they were made in.
const entryTypeRank = {
  message: 0,
  phase: 1,
  note: 1,
  tool: 1,
  written: 1,
  failure: 1,
  review: 2,
} as const satisfies Record<ActivityEntry['type'], number>

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

interface PhaseTitles {
  stageTitles: ReadonlyMap<string, string>
  subjectTitles: ReadonlyMap<string, string>
  kindTitles: ReadonlyMap<string, string>
  view: View
}

/**
 * The separator of a phase and the items under it. A phase of a stage that the user does not see
 * has none in the user view; the developer view keeps it with its stage title null. What the
 * phase wrote and the failure that ended it come last, at the time it ended.
 */
function phaseEntries(work: WorkEntry, titles: PhaseTitles): ActivityEntry[] {
  const stageTitle = titles.stageTitles.get(work.stage) ?? null
  if (stageTitle === null && titles.view !== 'developer') return []
  const items = phaseItems(work, titles.view).map((item, index): ActivityEntry => {
    const id = `${work.id}~${String(index)}`
    return item.type === 'tool'
      ? { type: 'tool', id: item.use.id, time: item.use.startedAt, phaseId: work.id, use: item.use }
      : {
          type: 'note',
          id,
          time: item.note.created_at,
          phaseId: work.id,
          note: item.note,
          isInProgress: item.isInProgress,
        }
  })
  const endedAt = work.steps.at(-1)?.finished_at ?? work.notes.at(-1)?.created_at ?? work.startedAt
  const kindGroups = kindGroupsOf(work, titles.kindTitles)
  return [
    {
      type: 'phase',
      id: work.id,
      time: work.startedAt,
      work,
      stageTitle,
      subjectTitle:
        work.subjectItemId === null
          ? null
          : (titles.subjectTitles.get(work.subjectItemId) ?? work.subjectKey),
    },
    ...items,
    ...(kindGroups.length === 0
      ? []
      : [
          {
            type: 'written' as const,
            id: `${work.id}~written`,
            time: endedAt,
            phaseId: work.id,
            kindGroups,
          },
        ]),
    ...(work.status === 'failed'
      ? [
          {
            type: 'failure' as const,
            id: `${work.id}~failure`,
            time: endedAt,
            phaseId: work.id,
            work,
          },
        ]
      : []),
  ]
}

/**
 * The entries of a run in the order of their time: a message first, then work, then a review.
 * The work is a separator for each phase, with its notes, its uses of a tool, what it wrote and
 * how it failed under it. A phase that a review comes in the middle of is cut there, and what the
 * work does next is a phase that continues it, so that nothing shows before what happened before
 * it. A message does not cut a phase: it comes between its items where it was written.
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
  const cuts = input.interrupts.map(({ created_at }) => created_at)
  const entries: ActivityEntry[] = [
    ...input.messages.map((message) => ({
      type: 'message' as const,
      id: message.id,
      time: message.created_at,
      message,
    })),
    ...input.work
      .flatMap((line) => splitWork(line, cuts))
      .flatMap((work) => phaseEntries(work, input)),
    ...input.interrupts.map((interrupt) => ({
      type: 'review' as const,
      id: interrupt.id,
      time: interrupt.created_at,
      interrupt,
    })),
  ]

  return entries.toSorted(
    (first, second) =>
      first.time.localeCompare(second.time) ||
      entryTypeRank[first.type] - entryTypeRank[second.type],
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

/**
 * The lines of work the user reads. A step of an internal stage, such as the one that reads a
 * message and decides what to do with it, is left out: what it says arrives as a message of the
 * chat. The developer view keeps every line. Stage titles that have not loaded yet leave nothing
 * out, so that no line disappears while the definition loads.
 */
export function shownWork<T extends { stage: string }>(
  work: T[],
  stageTitles: ReadonlyMap<string, string>,
  view: View,
): T[] {
  return view === 'user' && stageTitles.size > 0
    ? work.filter(({ stage }) => stageTitles.has(stage))
    : work
}
