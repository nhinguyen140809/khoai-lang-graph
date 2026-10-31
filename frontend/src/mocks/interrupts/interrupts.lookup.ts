import type { Interrupt, InterruptQuestion, InterruptStatus } from '@/modules/review/entities'
import type { Run, RunStep } from '@/modules/run/entities'
import type { CheckpointNode } from '@/modules/workflow/entities'
import { findNode } from '@/modules/workflow/entities'

import { artifactRefOf } from '../artifacts/artifact-refs.utils'
import { allArtifacts } from '../artifacts/artifacts.lookup'
import { stepsOfRun } from '../runs/lookup/runs.lookup'
import { IdPrefix } from '../shared/db'
import { choice } from '../shared/http/validation'
import { pageUrlParam } from '../shared/scenario'
import { workflowDefinitionFixture } from '../workflow/workflow.fixtures'
import { agentQuestionFixtures, agentQuestionsPromptFixture } from './interrupts.fixtures'
import { interruptEdits } from './interrupts.store'
import { type AgentQuestionMode, agentQuestionModes } from './interrupts.types'

// The interrupts of the runs, as the workflow definition describes its checkpoints: every step of a
// run at a checkpoint node of the definition is one interrupt, and its status follows the step and
// the run. A store keeps the answers.

// The id of the interrupt of a step: the id of the step, with the prefix of the interrupts.
function interruptIdOf(step: RunStep): string {
  return `${IdPrefix.Interrupt}${step.id.slice(IdPrefix.Step.length)}`
}

// What `?mock-agent-questions` asks of the interrupt that a run waits for: an interrupt that only
// asks questions, or a review with questions. Null leaves the questions of the definition.
function agentQuestionMode(): AgentQuestionMode | null {
  return choice(agentQuestionModes, pageUrlParam('mock-agent-questions')) ?? null
}

/** The interrupts of a run, in the order of its steps: one for each checkpoint it reached. */
export function interruptsOfRun(run: Run): Interrupt[] {
  return stepsOfRun(run.id).flatMap((step) => {
    const node = findNode(workflowDefinitionFixture, step.node)
    return node?.kind === 'checkpoint' ? [interruptOf(run, step, node)] : []
  })
}

/** The interrupt that a run waits for, or null when it waits for nothing. */
export function pendingInterruptOf(run: Run): Interrupt | null {
  return interruptsOfRun(run).find(({ status }) => status === 'pending') ?? null
}

function interruptOf(run: Run, step: RunStep, node: CheckpointNode): Interrupt {
  const id = interruptIdOf(step)
  const edit = interruptEdits.get()[id]
  const status = edit?.status ?? statusOf(run, step)
  return {
    id,
    run_id: run.id,
    step_id: step.id,
    node: node.id,
    allow_edits: node.allow_edits,
    review_artifacts: allArtifacts()
      .filter(
        (artifact) =>
          artifact.project_id === run.project_id &&
          node.review_artifact_kinds.includes(artifact.kind),
      )
      .map(artifactRefOf),
    status,
    created_at: step.started_at,
    resolved_at: edit?.resolved_at ?? (status === 'resolved' ? step.finished_at : null),
    ...asksOf(status, node),
  }
}

// Where a step of a checkpoint leaves its interrupt: answered when the step succeeded, waiting
// while the run itself waits, and dropped when the run stopped or failed at the checkpoint.
function statusOf(run: Run, step: RunStep): InterruptStatus {
  if (step.status === 'succeeded') return 'resolved'
  return step.status === 'running' && run.status === 'interrupted' ? 'pending' : 'cancelled'
}

// What the interrupt asks: the prompt, the options and the questions of the checkpoint; for the
// one that waits, the scenario may ask the agent questions only, or add them to the checkpoint.
function asksOf(
  status: InterruptStatus,
  node: CheckpointNode,
): Pick<Interrupt, 'prompt' | 'options' | 'questions'> {
  const mode = status === 'pending' ? agentQuestionMode() : null
  if (mode === 'only') {
    return { prompt: agentQuestionsPromptFixture, options: [], questions: agentQuestionFixtures }
  }
  const definitionQuestions = node.questions.map((question): InterruptQuestion => ({
    ...question,
    source: 'definition',
  }))
  return {
    prompt: node.prompt,
    options: node.options,
    questions:
      mode === 'added' ? [...definitionQuestions, ...agentQuestionFixtures] : definitionQuestions,
  }
}
