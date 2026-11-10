import { expect } from '@playwright/test'

import type { ApiClient } from './api-client.utils'
import {
  type ApiPage,
  expectAccepted,
  expectCreated,
  expectOk,
  expectPage,
} from './api-responses.utils'

export type RunStatus = 'queued' | 'running' | 'interrupted' | 'succeeded' | 'failed' | 'cancelled'

/** The parts of a run that the tests read. */
export interface ApiRun {
  id: string
  thread_id: string
  project_id: string
  number: number
  status: RunStatus
  current_stage: string
  step_count: number
  error: { code: string; message: string; stage: string } | null
}

export interface ApiOption {
  key: string
  label: string
  requires_feedback: boolean
  approves: boolean
}

/** What a run waits for. */
export interface ApiInterrupt {
  id: string
  run_id: string
  node: string
  prompt: string
  status: string
  options: ApiOption[]
  allow_edits: boolean
}

interface ApiProject {
  id: string
  name: string
}

interface ApiThread {
  id: string
}

/** Makes a project with this name and gives its id. */
export async function createProject(api: ApiClient, name: string): Promise<string> {
  const project = expectCreated(await api.post<ApiProject>('/projects', { name }))
  return project.id
}

/** Makes a thread in the project and gives its id. */
export async function createThread(api: ApiClient, projectId: string): Promise<string> {
  const thread = expectCreated(await api.post<ApiThread>(`/projects/${projectId}/threads`))
  return thread.id
}

interface SendOptions {
  /** The reviews the run stops at; none by default, so that the run goes on to its end. */
  reviews?: string[]
  idempotencyKey?: string | undefined
}

/** Sends a message to the thread, which starts a run, and gives that run as it started. */
export async function sendMessage(
  api: ApiClient,
  threadId: string,
  content: string,
  { reviews = [], idempotencyKey }: SendOptions = {},
): Promise<ApiRun> {
  const created = expectCreated(
    await api.post<{ run: ApiRun }>(
      `/threads/${threadId}/messages`,
      { content, run_config: { review_checkpoints: reviews } },
      { idempotencyKey },
    ),
  )
  return created.run
}

/** Makes a project and a thread and starts a run in it: the setup that most tests begin with. */
export async function startRun(
  api: ApiClient,
  content: string,
  options: SendOptions = {},
): Promise<{ projectId: string; threadId: string; run: ApiRun }> {
  const projectId = await createProject(api, `Project of ${content.slice(0, 30)}`)
  const threadId = await createThread(api, projectId)
  const run = await sendMessage(api, threadId, content, options)
  return { projectId, threadId, run }
}

/** Reads a run. */
export async function getRun(api: ApiClient, runId: string): Promise<ApiRun> {
  return expectOk(await api.get<ApiRun>(`/runs/${runId}`))
}

/** Waits until the run has one of these statuses, and gives it. */
export async function waitForRun(
  api: ApiClient,
  runId: string,
  statuses: RunStatus[],
  timeout = 30_000,
): Promise<ApiRun> {
  await expect
    .poll(async () => (await getRun(api, runId)).status, {
      timeout,
      message: `the run to be ${statuses.join(' or ')}`,
    })
    .toMatch(new RegExp(`^(${statuses.join('|')})$`))
  return getRun(api, runId)
}

/** Waits until the run stops at a review, and gives what it waits for. */
export async function waitForReview(api: ApiClient, runId: string): Promise<ApiInterrupt> {
  await waitForRun(api, runId, ['interrupted'])
  const page = expectPage(
    await api.get<ApiPage<ApiInterrupt>>(`/runs/${runId}/interrupts`, {
      status: 'pending',
      limit: 1,
    }),
  )
  const [pending] = page.items
  if (pending === undefined) throw new Error(`The run ${runId} waits for no review.`)
  return pending
}

interface Answer {
  option?: string
  feedback?: string
  answers?: Record<string, unknown>
}

/** The reply to the answer of a review, as it is, for a test that expects it to be refused. */
export function answerReview(api: ApiClient, review: ApiInterrupt, answer: Answer) {
  return api.post(`/runs/${review.run_id}/resume`, { interrupt_id: review.id, ...answer })
}

/** Answers a review and checks that the run goes on. */
export async function resumeRun(api: ApiClient, review: ApiInterrupt, answer: Answer) {
  expectAccepted(await answerReview(api, review, answer))
}

/** Approves each review the run stops at, with the option that approves, until the run ends. */
export async function approveEveryReview(api: ApiClient, runId: string): Promise<ApiRun> {
  for (;;) {
    const run = await waitForRun(api, runId, ['interrupted', 'succeeded', 'failed', 'cancelled'])
    if (run.status !== 'interrupted') return run
    const review = await waitForReview(api, runId)
    const approving = review.options.find((option) => option.approves)
    await resumeRun(api, review, approving === undefined ? {} : { option: approving.key })
  }
}
