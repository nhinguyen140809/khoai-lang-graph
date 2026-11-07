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

/**
 * The work of a run as lines, in order: the steps of the agents, those on one subject joined.
 * Steps without an agent role, such as a checkpoint or a control node, are left out: they do no
 * work that the user reads, and a checkpoint shows as the review it waits for.
 */
export function workEntries(steps: RunStep[], run: Pick<Run, 'status'> | null): WorkEntry[] {
  return groupSteps(steps)
    .map(stepsOfEntry)
    .filter((grouped) => grouped[0]?.agent_role !== null)
    .map((grouped) => {
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
        agentRole: first?.agent_role ?? '',
        modelId: last?.model_id ?? null,
        iteration: first?.iteration ?? 0,
        subjectItemId,
        subjectKey: subjectKey === null ? null : subjectKeyOfMessage(subjectKey),
        status: workStatusOf(grouped, run),
        startedAt: first?.started_at ?? '',
        durationMs:
          last?.finished_at === null || last?.finished_at === undefined || first === undefined
            ? null
            : msBetween(first.started_at, last.finished_at),
        costUsd: grouped.reduce((total, { usage }) => total + usage.cost_usd, 0),
        created: atLastVersion.filter(({ item_id }) => createdIds.has(item_id)),
        changed: atLastVersion.filter(({ item_id }) => !createdIds.has(item_id)),
        error: grouped.find(({ error }) => error !== null)?.error ?? null,
      }
    })
}
