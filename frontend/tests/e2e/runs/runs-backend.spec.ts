import { expect } from '@playwright/test'

import {
  type ApiPage,
  expectAccepted,
  expectCreated,
  expectOk,
  expectProblem,
} from '../../shared/api'
import { test } from '../../shared/fixtures.utils'
import { reviewNodes } from '../../shared/reviews.constants'
import { idea, laterIdea, reviewStops } from './runs-backend.data'

test('stops at each review of a new project and finishes after the last answer', async ({
  page,
  user,
}) => {
  await user.startProject(idea)

  for (const { status, prompt, approve, hasAsk } of reviewStops) {
    await user.expectRunStatus(`Waiting for you: ${status}`)
    // The agent asks what it needs before a review; the answer it suggests is sent.
    if (hasAsk) await user.pressButton('Send answers')
    await user.expectReviewPrompt(prompt)
    await user.answerReviewWith(approve)
  }

  await user.expectRunStatus('Done')
  await expect(page.getByRole('button', { name: 'Stop' })).toHaveCount(0)
})

test('stops a run that waits for a review', async ({ page, user }) => {
  await user.startProject(idea)
  await user.expectRunStatus('Waiting for you')

  await user.stopRun()

  await user.expectRunStatus('Stopped')
  await expect(page.getByRole('radio')).toHaveCount(0)
})

test('starts the next run of a thread at the intent router when a message comes after the end', async ({
  api,
}) => {
  const { threadId, run } = await api.startFinishedRun(idea)

  const next = await api.sendMessage(threadId, laterIdea)

  expect(next.number).toBe(run.number + 1)
  await api.waitForRun(next.id, ['succeeded'])
  const [first] = await api.listSteps(next.id)
  expect(first?.node).toBe('intent_router')
})

test('hands a message sent to a run that waits to that run and delivers it', async ({
  api,
  client,
}) => {
  const { threadId, run } = await api.startRun(idea, { reviews: [reviewNodes.personas] })
  const review = await api.waitForReview(run.id)

  const sent = expectCreated(
    await client.post<{ message: { delivery: string }; run: { id: string } }>(
      `/threads/${threadId}/messages`,
      { content: laterIdea },
    ),
  )
  await api.resumeRun(review, { option: 'approve' })
  await api.waitForRun(run.id, ['succeeded'])

  expect(sent.run.id).toBe(run.id)
  expect(sent.message.delivery).toBe('pending')
  const messages = expectOk(
    await client.get<ApiPage<{ content: string; delivery: string }>>(
      `/threads/${threadId}/messages`,
      { limit: 200 },
    ),
  )
  expect(messages.items.find((message) => message.content === laterIdea)?.delivery).toBe(
    'delivered',
  )
})

test('stops a run that waits for a review and refuses to stop it twice', async ({ api }) => {
  const { run } = await api.startRun(idea, { reviews: [reviewNodes.personas] })
  await api.waitForReview(run.id)

  expectAccepted(await api.cancelRun(run.id))

  expect((await api.getRun(run.id)).status).toBe('cancelled')
  expectProblem(await api.cancelRun(run.id), 409, 'invalid_state')
})

test('runs again from the last step of a finished run and keeps where it came from', async ({
  api,
}) => {
  const { run } = await api.startFinishedRun(idea)
  const steps = await api.listSteps(run.id)
  const last = steps.at(-1)
  if (last === undefined) throw new Error('The run has no step.')

  const again = expectAccepted(await api.retryRun(run.id, last.id))

  expect(again.retry_of_run_id).toBe(run.id)
  expect(again.number).toBe(run.number + 1)
  expect((await api.waitForRun(again.id, ['succeeded'])).error).toBeNull()
})

test('refuses to run again from the step of another run', async ({ api }) => {
  const { run } = await api.startFinishedRun(idea)
  const other = await api.startFinishedRun(laterIdea)
  const [foreign] = await api.listSteps(other.run.id)

  expectProblem(await api.retryRun(run.id, foreign?.id ?? ''), 422, 'validation_failed')
})

test('refuses to run again while the run waits for a review', async ({ api }) => {
  const { run } = await api.startRun(idea, { reviews: [reviewNodes.personas] })
  await api.waitForReview(run.id)
  const [first] = await api.listSteps(run.id)

  expectProblem(await api.retryRun(run.id, first?.id ?? ''), 409, 'run_already_active')
})
