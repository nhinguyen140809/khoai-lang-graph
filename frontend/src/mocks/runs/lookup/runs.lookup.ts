import type { Project } from '@/modules/project/entities'
import {
  isUnfinishedRunStatus,
  type Run,
  type RunDefaults,
  type RunStep,
} from '@/modules/run/entities'
import { newestOfEachGroup } from '@/shared/lib/collections'

import { allArtifacts } from '../../artifacts/artifacts.lookup'
import {
  generatedRuns,
  generatedRunSteps,
} from '../../generated/fixtures/generated-projects.fixtures'
import { modelsOfUserSettings } from '../../model-settings/model-settings.lookup'
import { mockRunStatus, mockScenario } from '../../shared/scenario'
import { currentUserSettings } from '../../user-settings/user-settings.lookup'
import { workflowDefinitionFixture } from '../../workflow/workflow.fixtures'
import { defaultRunConfigFixture, runFixtures, runStepFixtures } from '../fixtures/runs.fixtures'
import { createdRuns, runEdits } from '../runs.store'

// The runs and their steps as the mock server holds them now: the fixtures, the runs that messages
// started, and what changed in them.

/** The runs with the edits that stopping them made. */
function withRunEdits(runs: Run[]): Run[] {
  const edits = runEdits.get()
  return runs.map((run) => ({ ...run, ...edits[run.id] }))
}

// With `?mock-runs=empty`, no run exists.
export function allRuns(): Run[] {
  if (mockScenario('runs') === 'empty') return []
  return withRunEdits([...createdRuns.get(), ...runFixtures(mockRunStatus()), ...generatedRuns()])
}

export function findRun(runId: string): Run | undefined {
  return allRuns().find(({ id }) => id === runId)
}

/** The steps of a run of the fixtures. */
export function stepsOfRun(runId: string): RunStep[] {
  return generatedRunSteps(runId) ?? runStepFixtures(runId, mockRunStatus())
}

/** The runs of a thread. */
export function runsOfThread(threadId: string): Run[] {
  return allRuns().filter((run) => run.thread_id === threadId)
}

/**
 * The latest run of each thread, the one of the highest number, by the id of its thread: a run that
 * a later run of its thread replaced no longer counts.
 */
export function latestRunOfEachThread(runs: Run[] = allRuns()): Map<string, Run> {
  return newestOfEachGroup(
    runs,
    ({ thread_id: threadId }) => threadId,
    ({ number }) => number,
  )
}

/** The run of a thread that has not ended, if it has one. */
export function findUnfinishedRun(threadId: string): Run | undefined {
  return runsOfThread(threadId).find(({ status }) => isUnfinishedRunStatus(status))
}

// The settings that a level sets as a whole; the parameters are set one by one.
type WholeSetting = 'review_checkpoints' | 'max_steps' | 'max_cost_usd'

/**
 * The settings of a run that starts now. Each setting comes from the first level that sets it: the
 * `override` of the request that starts the run, then the settings of the project, then the run
 * defaults of the user, then the default of the server; the parameters are resolved one by one.
 * The output language is the one of the project. The models are resolved by agent role, from the
 * first level that sets one: the request, the overrides of the project, the model settings of the
 * user, then the default.
 */
export function resolveRunConfig(
  project: Pick<Project, 'run_config' | 'output_language' | 'model_overrides'> | undefined,
  override?: RunDefaults,
  models?: Record<string, string>,
): Run['run_config'] {
  // The levels, from the first to the last; the default of the server comes after them.
  const levels = [override, project?.run_config, currentUserSettings().default_run_config]
  const defaults = defaultRunConfigFixture
  const firstSet = <K extends WholeSetting>(setting: K) =>
    levels.map((level) => level?.[setting]).find((value) => value != null) ?? defaults[setting]
  return {
    ...defaults,
    models: {
      ...defaults.models,
      ...modelsOfUserSettings(),
      ...project?.model_overrides,
      ...models,
    },
    review_checkpoints: firstSet('review_checkpoints'),
    max_steps: firstSet('max_steps'),
    max_cost_usd: firstSet('max_cost_usd'),
    output_language: project?.output_language ?? defaults.output_language,
    parameters: levels
      .toReversed()
      .reduce<Record<string, unknown>>(
        (merged, level) => ({ ...merged, ...level?.parameters }),
        defaults.parameters,
      ),
  }
}

/**
 * The artifact that the node in progress of a run writes: the artifact of the project of the run
 * whose kind the workflow gives to the stage the run is in; undefined when the stage writes none.
 */
export function artifactInProgress(run: Pick<Run, 'project_id' | 'current_stage'>) {
  const kind = workflowDefinitionFixture.artifact_kinds.find(
    ({ stage }) => stage === run.current_stage,
  )?.kind
  if (kind === undefined) return undefined
  return allArtifacts().find(
    (artifact) => artifact.project_id === run.project_id && artifact.kind === kind,
  )
}
