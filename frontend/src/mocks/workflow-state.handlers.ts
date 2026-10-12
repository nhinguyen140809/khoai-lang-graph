import { http, HttpResponse } from 'msw'

import { mockArtifacts } from './artifacts.fixtures'
import { allItems } from './artifacts.handlers'
import definition from './data/workflow/requirements_engineering.v1.json'
import { answerScenario, mockScenario } from './mock-scenario.utils'
import { notFound } from './problem.utils'
import { findMockRun, stepsOfRun } from './runs.handlers'

// The workflow state of a run, as the checkpoint of a step would hold it: references to the
// artifacts and items of the project, each list present once the run reached its stage.

const stages = definition.stages.map(({ key }) => key)

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

function valuesOf(projectId: string, stage: string, status: string, iteration: number) {
  const reached = (from: string) => stages.indexOf(stage) >= stages.indexOf(from)
  const artifactRef = (kind: string) => {
    const found = mockArtifacts.find(
      (artifact) => artifact.project_id === projectId && artifact.kind === kind,
    )
    return found === undefined
      ? null
      : { artifact_id: found.id, kind, title: found.title, version: found.version }
  }
  const items = allItems().filter((item) => item.project_id === projectId)
  return {
    project_id: projectId,
    current_stage: stage,
    status,
    error: null,
    iteration_count: iteration,
    active_persona_index: reached('interviewing') ? 1 : 0,
    interview_turn: reached('interviewing') ? 3 : 0,
    interviewer_stop: false,
    elicitation_plan: reached('planning') ? artifactRef('elicitation_plan') : null,
    ...Object.fromEntries(
      itemLists.map(([name, kind, from]) => [
        name,
        reached(from)
          ? items
              .filter((item) => item.kind === kind)
              .map(({ id, key, version }) => ({ item_id: id, kind, key, version }))
          : [],
      ]),
    ),
    interview_transcripts: reached('interviewing')
      ? mockArtifacts
          .filter(
            (artifact) =>
              artifact.project_id === projectId && artifact.kind === 'interview_transcript',
          )
          .map((artifact) => ({
            artifact_id: artifact.id,
            kind: artifact.kind,
            title: artifact.title,
            version: artifact.version,
          }))
      : [],
    validation_report: reached('validation') ? artifactRef('validation_report') : null,
    rework_directives: [],
  }
}

export const workflowStateHandlers = [
  http.get('/api/v1/runs/:runId/state', async ({ params }) => {
    const answered = await answerScenario(mockScenario('state'))
    if (answered !== null) return answered
    const run = findMockRun(String(params.runId))
    if (run === undefined) return notFound('The run')
    const last = stepsOfRun(run.id).at(-1)
    return HttpResponse.json({
      run_id: run.id,
      step_id: last?.id ?? null,
      workflow_version: run.workflow_version,
      values: valuesOf(run.project_id, run.current_stage, run.status, run.iteration_count),
    })
  }),

  http.get('/api/v1/runs/:runId/steps/:stepId/state', async ({ params }) => {
    const answered = await answerScenario(mockScenario('state'))
    if (answered !== null) return answered
    const run = findMockRun(String(params.runId))
    if (run === undefined) return notFound('The run')
    const step = stepsOfRun(run.id).find(({ id }) => id === params.stepId)
    if (step === undefined) return notFound('The step')
    return HttpResponse.json({
      run_id: run.id,
      step_id: step.id,
      workflow_version: run.workflow_version,
      values: valuesOf(run.project_id, step.stage, step.status, step.iteration),
    })
  }),
]
