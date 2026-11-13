import { expect } from '@playwright/test'

import { test } from '../../shared/fixtures.utils'
import { reviewNodes } from '../../shared/reviews.constants'
import { followUp, idea, rework } from './review-answers-backend.data'

test('asks for the feedback of a rejection and sends the run back once it is given', async ({
  api,
  page,
  user,
}) => {
  const { projectId, run } = await api.startRun(idea, { reviews: [reviewNodes.analysis] })
  const review = await api.waitForReview(run.id)
  await user.openActivity(projectId)
  await user.expectReviewPrompt(/requirements analysis/)

  await user.chooseReviewOption(rework.option)
  // The agent suggests the feedback of the option; the user clears it, and the answer is refused.
  await user.fillReviewFeedback(rework.option, '')
  await user.sendReview()
  await user.expectText(rework.missing)
  expect((await api.getRun(run.id)).status).toBe('interrupted')
  await user.fillReviewFeedback(rework.option, rework.feedback)
  await user.sendReview()

  await expect
    .poll(async () => {
      const waiting = await api.pendingReview(run.id)
      return waiting !== null && waiting.id !== review.id
    })
    .toBe(true)
  await user.expectReviewPrompt(/requirements analysis/)
  await expect(page.getByRole('radio', { name: rework.option })).toBeVisible()
})

test('starts the next run from a message written in the chat of a finished project', async ({
  api,
  client,
  user,
}) => {
  const { projectId, threadId } = await api.startFinishedRun(idea)
  await user.openActivity(projectId)

  await user.sendChatMessage(followUp)

  await user.expectText(followUp)
  await user.expectRunStatus('Done')
  await expect
    .poll(async () => {
      const runs = await client.get<{ items: { id: string }[] }>(`/threads/${threadId}/runs`)
      return runs.body.items.length
    })
    .toBe(2)
})
