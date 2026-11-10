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
  retry_of_run_id: string | null
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
  review_artifacts: { artifact_id: string; kind: string; title: string; version: number }[]
}

export interface ApiStep {
  id: string
  sequence: number
  node: string
  status: string
}

export interface ApiItem {
  id: string
  key: string
  kind: string
  version: number
  content: Record<string, unknown>
}

export interface ApiArtifact {
  id: string
  kind: string
  title: string
  version: number
}

export interface ApiExport {
  id: string
  template: string
  format: string
  status: string
  file_name: string
  size_bytes: number
  download_url: string
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
  modified_items?: { item_id: string; version: number }[]
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

/** Starts a run that goes to its end without a review, and waits until it has. */
export async function startFinishedRun(api: ApiClient, content: string) {
  const started = await startRun(api, content)
  const run = await waitForRun(api, started.run.id, ['succeeded'])
  return { ...started, run }
}

/** The steps of a run, in the order they ran. */
export async function listSteps(api: ApiClient, runId: string): Promise<ApiStep[]> {
  return expectPage(await api.get<ApiPage<ApiStep>>(`/runs/${runId}/steps`, { limit: 200 })).items
}

/** The reply to a request to run again from a step, as it is. */
export function retryRun(api: ApiClient, runId: string, fromStepId: string) {
  return api.post<ApiRun>(`/runs/${runId}/retry`, { from_step_id: fromStepId })
}

/** The reply to a request to stop a run, as it is. */
export function cancelRun(api: ApiClient, runId: string) {
  return api.post<ApiRun>(`/runs/${runId}/cancel`)
}

/** The artifacts of a project. */
export async function listArtifacts(api: ApiClient, projectId: string): Promise<ApiArtifact[]> {
  return expectPage(
    await api.get<ApiPage<ApiArtifact>>(`/projects/${projectId}/artifacts`, { limit: 200 }),
  ).items
}

/** The items of an artifact. */
export async function listItems(api: ApiClient, artifactId: string): Promise<ApiItem[]> {
  return expectPage(
    await api.get<ApiPage<ApiItem>>(`/artifacts/${artifactId}/items`, { limit: 200 }),
  ).items
}

/** The reply to the edit of the content of an item, as it is. */
export function editItem(api: ApiClient, item: ApiItem, content: Record<string, unknown>) {
  return api.patch<ApiItem>(`/items/${item.id}`, { content: { ...item.content, ...content } })
}

/** The reply to the request of an export of a project, as it is. */
export function createExport(api: ApiClient, projectId: string, template: string, format: string) {
  return api.post<ApiExport>(`/projects/${projectId}/exports`, { template, format })
}
