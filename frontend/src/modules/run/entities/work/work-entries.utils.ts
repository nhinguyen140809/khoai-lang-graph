import { type ItemRef, subjectKeyOfMessage } from '@/modules/artifact/entities/@x/run'
import { newestOfEachGroup } from '@/shared/lib/collections'
import { msBetween } from '@/shared/lib/time'

import type { Run } from '../runs/runs.types'
import type { RunStatus } from '../status/run-status.types'
import type { RunStep, RunStepStatus, StepEntry } from '../steps/run-steps.types'
import { groupSteps } from '../steps/step-groups.utils'
import type { WorkEntry, WorkStatus } from './work.types'

/** The work status of a step that runs, by the status of its run. */
const workStatusOfRunningRun = {
  queued: 'running',
  running: 'running',
  interrupted: 'waiting',
  succeeded: 'done',
  failed: 'failed',
  cancelled: 'stopped',
} as const satisfies Record<RunStatus, WorkStatus>

/** The work status of a step, from its status; a step that runs takes the status of its run. */
const workStatusOfStep = {
  running: (runStatus: RunStatus | null): WorkStatus =>
    runStatus === null ? 'running' : workStatusOfRunningRun[runStatus],
  succeeded: (): WorkStatus => 'done',
  failed: (): WorkStatus => 'failed',
  skipped: (): WorkStatus => 'done',
} as const satisfies Record<RunStepStatus, (runStatus: RunStatus | null) => WorkStatus>

/** What a line of work is doing, from its last step and the status of its run. */
function workStatusOf(steps: readonly RunStep[], run: Pick<Run, 'status'> | null): WorkStatus {
  const last = steps.at(-1)
  return last === undefined ? 'done' : workStatusOfStep[last.status](run?.status ?? null)
}

/** The items of what the steps produced, each once at its last (or first) version among them. */
function versionOfEach(produced: readonly ItemRef[], rank: 1 | -1) {
  return [
    ...newestOfEachGroup(
      produced,
      ({ item_id }) => item_id,
      ({ version }) => rank * version,
    ).values(),
  ]
}

/** The steps of one entry of `groupSteps`, as the flat list they joined. */
function stepsOfEntry(entry: StepEntry): RunStep[] {
  return entry.type === 'group' ? entry.steps : [entry.step]
}

/** The steps of a phase: those of the stage, the subject and the round that follow one another. */
function isSamePhase(first: RunStep | undefined, second: RunStep | undefined): boolean {
  if (first === undefined || second === undefined) return false
  return (
    first.stage === second.stage &&
    first.subject_item_id === second.subject_item_id &&
    first.iteration === second.iteration
  )
}

/** The lists of steps, with those that make one phase next to each other joined. */
function joinedPhases(lists: RunStep[][]): RunStep[][] {
  const phases: RunStep[][] = []
  for (const steps of lists) {
    const last = phases.at(-1)
    if (last !== undefined && isSamePhase(last[0], steps[0])) last.push(...steps)
    else phases.push([...steps])
  }
  return phases
}

/**
 * The work of a run as phases, in order: the steps of the agents, those that follow one another in
 * one stage, on one subject and in one round joined.
 * Steps without an agent role, such as a checkpoint or a control node, are left out: they do no
 * work that the user reads, and a checkpoint shows as the review it waits for.
 */
export function workEntries(steps: RunStep[], run: Pick<Run, 'status'> | null): WorkEntry[] {
  return joinedPhases(
    groupSteps(steps)
      .map(stepsOfEntry)
      .filter((grouped) => grouped[0]?.agent_role !== null),
  ).map((grouped) => {
    const first = grouped[0]
    const last = grouped.at(-1)
    const produced = grouped.flatMap(({ produced }) => produced)
    const atLastVersion = versionOfEach(produced, 1)
    const createdIds = new Set(
      versionOfEach(produced, -1)
        .filter(({ version }) => version === 1)
        .map(({ item_id }) => item_id),
    )
    const subjectItemId = first?.subject_item_id ?? null
    const subjectKey =
      subjectItemId === null
        ? null
        : (produced.find(({ item_id }) => item_id === subjectItemId)?.key ?? null)
    return {
      id: first?.id ?? '',
      steps: grouped,
      stage: first?.stage ?? '',
      node: first?.node ?? '',
      nodes: [...new Set(grouped.map(({ node }) => node))],
      agentRole: first?.agent_role ?? '',
      modelId: last?.model_id ?? null,
      iteration: first?.iteration ?? 0,
      subjectItemId,
      subjectKey: subjectKey === null ? null : subjectKeyOfMessage(subjectKey),
      status: workStatusOf(grouped, run),
      continues: false,
      startedAt: first?.started_at ?? '',
      durationMs:
        last?.finished_at === null || last?.finished_at === undefined || first === undefined
          ? null
          : msBetween(first.started_at, last.finished_at),
      costUsd: grouped.reduce((total, { usage }) => total + usage.cost_usd, 0),
      created: atLastVersion.filter(({ item_id }) => createdIds.has(item_id)),
      changed: atLastVersion.filter(({ item_id }) => !createdIds.has(item_id)),
      notes: grouped.flatMap(({ notes }) => notes),
      error: grouped.find(({ error }) => error !== null)?.error ?? null,
    }
  })
}

/**
 * A line of work in the parts that the given times cut it into, in order. A step writes its notes
 * as it works, so a message that comes while it works lands between its notes: the line stops
 * there, and what the step notes next is a new line that continues it. Only the last part keeps
 * the steps, the cost, what was written and how the work ended; the parts before it are done.
 * A time cuts only where it leaves notes on both sides, or a step still running after it, so the
 * report that a step posts as it ends does not make a line of its own, and two times with no note
 * between them make one cut. The line comes back whole when nothing cuts it.
 */
export function splitWork(work: WorkEntry, cuts: readonly string[]): WorkEntry[] {
  const lastStep = work.steps.at(-1)
  const startMs = Date.parse(work.startedAt)
  const endMs = lastStep?.finished_at ? Date.parse(lastStep.finished_at) : null
  const notes = work.notes.map((note) => ({ note, at: Date.parse(note.created_at) }))

  const kept: { at: number; time: string }[] = []
  for (const time of cuts.toSorted((first, second) => Date.parse(first) - Date.parse(second))) {
    const at = Date.parse(time)
    const isInside = at > startMs && (endMs === null || at < endMs)
    if (!isInside) continue
    const from = kept.at(-1)?.at ?? Number.NEGATIVE_INFINITY
    const hasNotesBefore =
      kept.length === 0 || notes.some((entry) => entry.at >= from && entry.at < at)
    const hasNotesAfter = endMs === null || notes.some((entry) => entry.at >= at)
    if (hasNotesBefore && hasNotesAfter) kept.push({ at, time })
  }
  if (kept.length === 0) return [work]

  const starts = [Number.NEGATIVE_INFINITY, ...kept.map(({ at }) => at)]
  return starts.map((from, index) => {
    const to = starts[index + 1] ?? Number.POSITIVE_INFINITY
    const part = {
      ...work,
      id: index === 0 ? work.id : `${work.id}~${String(index)}`,
      continues: index > 0,
      startedAt: kept[index - 1]?.time ?? work.startedAt,
      notes: notes.filter((entry) => entry.at >= from && entry.at < to).map(({ note }) => note),
    }
    return index === starts.length - 1
      ? part
      : {
          ...part,
          status: 'done' as const,
          durationMs: null,
          costUsd: 0,
          steps: [],
          created: [],
          changed: [],
          error: null,
        }
  })
}
