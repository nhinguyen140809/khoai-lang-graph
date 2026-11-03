import type { Run, RunState, RunStep } from '@/modules/run/entities'

import { artifactRefOf } from '../../artifacts/artifact-refs.utils'
import { allArtifacts, allItems } from '../../artifacts/artifacts.lookup'
import { workflowDefinitionFixture } from '../../workflow/workflow.fixtures'

// The workflow state of a run, as the checkpoint of a step would hold it: references to the
// artifacts and items of the project, each list present once the run reached its stage.

const stageKeys = workflowDefinitionFixture.stages.map(({ key }) => key)

// The lists of items in the state: its name, the kind of the items, and the stage that fills it.
const itemLists = [
  ['personas', 'persona', 'persona_generation'],
  ['raw_requirements', 'raw_requirement', 'analysis'],
  ['analyzed_requirements', 'analyzed_requirement', 'analysis'],
  ['latent_needs', 'latent_need', 'analysis'],
  ['assumptions', 'assumption', 'analysis'],
  ['ambiguities', 'ambiguity_issue', 'analysis'],
  ['conflicts', 'conflict', 'analysis'],
  ['requirement_specification', 'spec_requirement', 'specification'],
  ['product_backlog', 'backlog_item', 'backlog'],
] as const

interface Moment {
  stage: string
  status: string
  iteration: number
}

function valuesOf(projectId: string, { stage, status, iteration }: Moment) {
  const isReached = (from: string) => stageKeys.indexOf(stage) >= stageKeys.indexOf(from)
  const artifacts = allArtifacts().filter((artifact) => artifact.project_id === projectId)
  const latest = (kind: string) => {
    const found = artifacts.find((artifact) => artifact.kind === kind)
    return found === undefined ? null : artifactRefOf(found)
  }
  const items = allItems().filter((item) => item.project_id === projectId)
  return {
    project_id: projectId,
    current_stage: stage,
    status,
    error: null,
    iteration_count: iteration,
    active_persona_index: isReached('interviewing') ? 1 : 0,
    interview_turn: isReached('interviewing') ? 3 : 0,
    interviewer_stop: false,
    elicitation_plan: isReached('planning') ? latest('elicitation_plan') : null,
    ...Object.fromEntries(
      itemLists.map(([name, kind, from]) => [
        name,
        isReached(from)
          ? items
              .filter((item) => item.kind === kind)
              .map(({ id, key, version }) => ({ item_id: id, kind, key, version }))
          : [],
      ]),
    ),
    interview_transcripts: isReached('interviewing')
      ? artifacts.filter(({ kind }) => kind === 'interview_transcript').map(artifactRefOf)
      : [],
    validation_report: isReached('validation') ? latest('validation_report') : null,
    rework_directives: [],
  }
}

/** The workflow state of a run now, after its last step; the step is none for a run without steps. */
export function currentStateOfRun(run: Run, lastStep: RunStep | undefined): RunState {
  return {
    run_id: run.id,
    step_id: lastStep?.id ?? null,
    workflow_version: run.workflow_version,
    values: valuesOf(run.project_id, {
      stage: run.current_stage,
      status: run.status,
      iteration: run.iteration_count,
    }),
  }
}

/** The workflow state of a run after one of its steps. */
export function stateOfRunAfterStep(run: Run, step: RunStep): RunState {
  return {
    run_id: run.id,
    step_id: step.id,
    workflow_version: run.workflow_version,
    values: valuesOf(run.project_id, {
      stage: step.stage,
      status: step.status,
      iteration: step.iteration,
    }),
  }
}
