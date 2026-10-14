import { http, HttpResponse } from 'msw'

import type { Run } from '@/features/threads'

import { mockArtifacts } from './artifacts.fixtures'
import { mockArtifactItems } from './artifacts.fixtures'
import definition from './data/workflow/requirements_engineering.v1.json'
import { artifactStatuses, type ItemEdit, itemEdits } from './mock-artifacts.store'
import { IdPrefix, mockId } from './mock-ids.constants'
import { changeRun } from './mock-runs.store'
import { answerScenario, mockScenario, pageParam } from './mock-scenario.utils'
import { paginate } from './pagination.utils'
import { notFound, problem, validationFailed } from './problem.utils'
import { allRuns, findMockRun } from './runs.handlers'

// The pauses of the runs, as the workflow definition describes its checkpoints: a run that is
// interrupted waits at the checkpoint of its stage.

interface Choice {
  key: string
  label: string
  requires_text: boolean
}

interface MockQuestion {
  key: string
  type: 'single_select' | 'multi_select' | 'free_text' | 'number'
  prompt: string
  required: boolean
  choices: Choice[]
  min_selected: number | null
  max_selected: number | null
  default_answer: { choice_keys: string[]; text: string | null; number: number | null }
  source: string
}

// With `?mock-review=questions`, the checkpoint asks questions instead of offering options.
const questions: MockQuestion[] = [
  {
    key: 'users',
    type: 'multi_select',
    prompt: 'Who will use the platform?',
    required: true,
    choices: [
      { key: 'students', label: 'Students', requires_text: false },
      { key: 'mentors', label: 'Mentors', requires_text: false },
      { key: 'other', label: 'Someone else, please specify', requires_text: true },
    ],
    min_selected: 1,
    max_selected: null,
    default_answer: { choice_keys: ['students', 'mentors'], text: null, number: null },
    source: 'agent',
  },
  {
    key: 'payments',
    type: 'single_select',
    prompt: 'Should the first version take payments?',
    required: true,
    choices: [
      { key: 'yes', label: 'Yes', requires_text: false },
      { key: 'no', label: 'No', requires_text: false },
    ],
    min_selected: null,
    max_selected: null,
    default_answer: { choice_keys: ['no'], text: null, number: null },
    source: 'agent',
  },
  {
    key: 'sessions_per_week',
    type: 'number',
    prompt: 'How many sessions should a mentor offer per week?',
    required: false,
    choices: [],
    min_selected: null,
    max_selected: null,
    default_answer: { choice_keys: [], text: null, number: 2 },
    source: 'agent',
  },
  {
    key: 'notes',
    type: 'free_text',
    prompt: 'Anything else the agents should know?',
    required: false,
    choices: [],
    min_selected: null,
    max_selected: null,
    default_answer: { choice_keys: [], text: null, number: null },
    source: 'agent',
  },
]

interface Checkpoint {
  id: string
  prompt: string
  review_artifact_kinds: string[]
  allow_edits: boolean
  options: {
    key: string
    label: string
    requires_feedback: boolean
    approves: boolean
    is_default: boolean
  }[]
  questions: MockQuestion[]
}

// The checkpoint at which a run waits: the node of the definition for the stage of the run.
function checkpointOf(run: Run): Checkpoint | undefined {
  const node = definition.nodes.find(
    (entry) => entry.kind === 'checkpoint' && entry.stage === run.current_stage,
  )
  return node === undefined ? undefined : (node as unknown as Checkpoint)
}

/** The review that a run waits for, or null when it is not at a checkpoint. */
export function pendingInterrupt(run: Run) {
  if (run.status !== 'interrupted') return null
  const node = checkpointOf(run)
  if (node === undefined) return null
  const kinds = node.review_artifact_kinds
  const asksQuestions = pageParam('mock-review') === 'questions'
  return {
    id: mockId(IdPrefix.Interrupt, Number(run.id.slice(-12)) || 1),
    run_id: run.id,
    step_id: null,
    node: node.id,
    prompt: asksQuestions ? 'A few details before the plan is made.' : node.prompt,
    options: asksQuestions ? [] : node.options,
    questions: asksQuestions ? questions : node.questions,
    allow_edits: node.allow_edits,
    review_artifacts: mockArtifacts
      .filter((artifact) => artifact.project_id === run.project_id && kinds.includes(artifact.kind))
      .map((artifact) => ({
        artifact_id: artifact.id,
        kind: artifact.kind,
        title: artifact.title,
        version: artifact.version,
      })),
    status: 'pending' as const,
    created_at: run.started_at ?? new Date().toISOString(),
    resolved_at: null,
  }
}

// The stage that a run goes on at after an answer: the next stage when the option approves, else
// the stage that the option sends it back to.
const sendBackTo: Record<string, string> = {
  reject_reanalyse: 'analysis',
  reject_reinterview: 'interviewing',
  not_ok: 'specification',
}

function nextStage(run: Run, optionKey: string | null, approves: boolean): string {
  const stages = definition.stages.map(({ key }) => key)
  const back = optionKey === null ? undefined : sendBackTo[optionKey]
  if (!approves && back !== undefined) return back
  return stages[stages.indexOf(run.current_stage) + 1] ?? 'done'
}

/** What an approval changes: the artifacts under review and their draft items become approved. */
function approve(artifactIds: string[]) {
  const edits = itemEdits.get()
  const next: Record<string, ItemEdit> = { ...edits }
  const at = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
  for (const item of mockArtifactItems) {
    if (!artifactIds.includes(item.artifact_id)) continue
    const current = edits[item.id]
    const status = current?.review_status ?? item.review_status
    if (status !== 'draft') continue
    next[item.id] = {
      version: (current?.version ?? item.version) + 1,
      content: current?.content ?? item.content,
      review_status: 'approved',
      updated_at: at,
      history: current?.history ?? [],
    }
  }
  itemEdits.set(next)
  artifactStatuses.set({
    ...artifactStatuses.get(),
    ...Object.fromEntries(artifactIds.map((id) => [id, 'approved'])),
  })
}

interface ResumeBody {
  interrupt_id?: string
  option?: string | null
  feedback?: string | null
  answers?: Record<string, { choice_keys: string[]; text: string | null; number: number | null }>
  modified_items?: unknown[]
}

export const interruptHandlers = [
  http.get('/api/v1/runs/:runId/interrupts', async ({ params, request }) => {
    const scenario = mockScenario('review')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const run = findMockRun(String(params.runId))
    if (run === undefined) return notFound('The run')
    const pending = scenario === 'empty' ? null : pendingInterrupt(run)
    const status = new URL(request.url).searchParams.get('status')
    const items = pending !== null && (status === 'pending' || status === null) ? [pending] : []
    return HttpResponse.json(paginate(items, request))
  }),

  http.post('/api/v1/runs/:runId/resume', async ({ params, request }) => {
    const run = allRuns().find(({ id }) => id === params.runId)
    if (run === undefined) return notFound('The run')
    const pending = pendingInterrupt(run)
    const body = (await request.json()) as ResumeBody
    if (pending === null || body.interrupt_id !== pending.id) {
      return problem(
        409,
        'invalid_state',
        'Invalid state',
        'The run is not waiting for this answer.',
      )
    }

    const errors: { field: string; message: string }[] = []
    const option = pending.options.find(({ key }) => key === body.option)
    if (pending.options.length > 0 && option === undefined) {
      errors.push({ field: 'option', message: 'Not an option of this review.' })
    }
    if (option?.requires_feedback === true && (body.feedback ?? '').trim() === '') {
      errors.push({ field: 'feedback', message: 'This option needs feedback.' })
    }
    for (const question of pending.questions) {
      const answer = body.answers?.[question.key]
      const missing =
        question.required &&
        (answer === undefined ||
          (question.type === 'number'
            ? answer.number === null
            : question.type === 'free_text'
              ? (answer.text ?? '').trim() === ''
              : answer.choice_keys.length === 0))
      if (missing) errors.push({ field: question.key, message: 'Answer this question.' })
    }
    if (!pending.allow_edits && (body.modified_items ?? []).length > 0) {
      errors.push({ field: 'modified_items', message: 'This review does not accept edits.' })
    }
    if (errors.length > 0) {
      return validationFailed(errors)
    }

    const approves = option?.approves ?? true
    if (approves) approve(pending.review_artifacts.map(({ artifact_id }) => artifact_id))
    changeRun(run.id, {
      status: 'running',
      current_stage: nextStage(run, option?.key ?? null, approves),
    })
    return HttpResponse.json(
      allRuns().find(({ id }) => id === run.id),
      { status: 202 },
    )
  }),
]
