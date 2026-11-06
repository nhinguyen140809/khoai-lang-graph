import type { StageSubject } from '@/modules/artifact/entities/@x/run'
import type { VisibleStage } from '@/modules/workflow/entities/@x/run'
import { firstInOrder } from '@/shared/lib/collections'

import type { Run } from '../runs/runs.types'
import type { RunStatus } from '../status/run-status.types'
import type { RunStep } from '../steps/run-steps.types'
import { orderedSteps } from '../steps/run-steps.utils'
import type { WorkEntry, WorkStatus } from '../work/work.types'
import { workEntries } from '../work/work-entries.utils'
import type { StageProgress, StageStatus, SubjectProgress } from './stage-progress.types'

/** The statuses of a stage or of a subject, from the one that needs the user most. */
export const stageStatusesByAttention: readonly StageStatus[] = [
  'waiting',
  'failed',
  'running',
  'stopped',
  'done',
  'not_started',
] as const

/** The status the current stage takes, from the status of its run. */
export const stageStatusOfRun = {
  queued: 'running',
  running: 'running',
  interrupted: 'waiting',
  succeeded: 'done',
  failed: 'failed',
  cancelled: 'stopped',
} as const satisfies Record<RunStatus, StageStatus>

/** The status of a subject of a stage, from the status of its latest line of work. */
export const stageStatusOfWork = {
  running: 'running',
  waiting: 'waiting',
  stopped: 'stopped',
  done: 'done',
  failed: 'failed',
} as const satisfies Record<WorkStatus, StageStatus>

/** The stages of the tree as a flat list, parents before their children, in their order. */
function flatStages(stages: readonly VisibleStage[]): VisibleStage[] {
  return stages.flatMap((stage) => [stage, ...flatStages(stage.children)])
}

/** The stage the run is in, as the user sees it: the one it names, else the one of its latest visible step. */
function currentStageOf(
  run: Pick<Run, 'status' | 'current_stage'> | null,
  steps: readonly RunStep[],
  visibleKeys: ReadonlySet<string>,
): string | null {
  if (run === null) return null
  if (visibleKeys.has(run.current_stage)) return run.current_stage
  for (const step of orderedSteps([...steps]).toReversed()) {
    if (visibleKeys.has(step.stage)) return step.stage
  }
  return null
}

/** Whether the stage is the current one or holds it. */
function hasCurrentStage(stage: VisibleStage, current: string | null): boolean {
  if (current === null) return false
  return stage.key === current || stage.children.some((child) => hasCurrentStage(child, current))
}

/** The subjects of a stage that runs once for each, as far as the run went. */
function subjectProgresses(
  stageKey: string,
  subjects: readonly StageSubject[],
  work: readonly WorkEntry[],
): SubjectProgress[] {
  const linesOf = new Map<string, WorkEntry[]>()
  for (const line of work) {
    if (line.stage !== stageKey || line.subjectItemId === null) continue
    const lines = linesOf.get(line.subjectItemId) ?? []
    lines.push(line)
    linesOf.set(line.subjectItemId, lines)
  }
  const started = [...subjects]
    .map((subject) => {
      const lines = linesOf.get(subject.id) ?? []
      return {
        subject,
        startedAt: lines[0]?.startedAt ?? null,
        latest: lines.at(-1),
      }
    })
    .toSorted((first, second) => first.subject.key.localeCompare(second.subject.key))
    .toSorted((first, second) => {
      // The subjects the run took come first, in the order it took them; the others keep the
      // order of their keys.
      if (first.startedAt === null && second.startedAt === null) return 0
      if (first.startedAt === null) return 1
      if (second.startedAt === null) return -1
      return first.startedAt.localeCompare(second.startedAt)
    })
  return started.map(({ subject, latest }, index) => ({
    subject,
    number: index + 1,
    status: latest === undefined ? 'not_started' : stageStatusOfWork[latest.status],
    workStatus: latest?.status ?? null,
    workId: latest?.id ?? null,
    durationMs: latest?.durationMs ?? null,
  }))
}

/**
 * Every stage that the user sees, as the definition nests them, with its status from the steps
 * and the run: the current stage takes the status of the run, a stage with steps is done, the
 * others have not started; a stage with children takes the status of the child that needs the
 * user most. A stage that runs once for each subject lists its subjects after its children, in the
 * order the run takes them.
 */
export function stageProgress(
  stages: readonly VisibleStage[],
  input: {
    steps: RunStep[]
    run: Pick<Run, 'status' | 'current_stage'> | null
    subjects: ReadonlyMap<string, StageSubject[]>
  },
): StageProgress[] {
  const { steps, run, subjects } = input
  const visibleKeys = new Set(flatStages(stages).map(({ key }) => key))
  const current = currentStageOf(run, steps, visibleKeys)
  const work = workEntries(steps, run)

  function build(stage: VisibleStage, number: number): StageProgress {
    const stepsOfStage = steps.filter((step) => step.stage === stage.key)
    const children = stage.children.map((child, index) => build(child, index + 1))
    const ownStatus: StageStatus =
      stage.key === current && run !== null
        ? stageStatusOfRun[run.status]
        : stepsOfStage.length > 0
          ? 'done'
          : 'not_started'
    const status =
      children.length > 0
        ? (firstInOrder(
            [ownStatus, ...children.map(({ status }) => status)],
            stageStatusesByAttention,
          ) ?? ownStatus)
        : ownStatus
    const workOfStage = work.filter((line) => line.stage === stage.key)
    return {
      key: stage.key,
      title: stage.title,
      number,
      status,
      isOpen: hasCurrentStage(stage, current),
      latestWorkId: workOfStage.at(-1)?.id ?? null,
      children,
      subjects: subjectProgresses(stage.key, subjects.get(stage.key) ?? [], work),
    }
  }

  return stages.map((stage, index) => build(stage, index + 1))
}
