import { expect } from '@playwright/test'

import { expectAccepted, expectProblem, expectStatus } from '../../shared/api'
import { test } from '../../shared/fixtures.utils'
import { reviewNodes } from '../../shared/reviews.constants'
import { idea, refusedAnswers } from './reviews-backend.data'

for (const { name, node, answer, field } of refusedAnswers) {
  test(`refuses ${name} and keeps waiting`, async ({ api, client }) => {
    const { run } = await api.startRun(idea, { reviews: [node] })
    const review = await api.waitForReview(run.id)

    expectProblem(await api.answerReview(review, answer), 422, 'validation_failed', field)

    expect((await api.getRun(run.id)).status).toBe('interrupted')
    expectStatus(await client.get(`/runs/${run.id}`), 200)
  })
}

test('continues after the answer and refuses a second answer', async ({ api }) => {
  const { run } = await api.startRun(idea, { reviews: [reviewNodes.personas] })
  const review = await api.waitForReview(run.id)

  await api.resumeRun(review, { option: 'approve' })

  const finished = await api.waitForRun(run.id, ['succeeded'])
  expect(finished.error).toBeNull()
  expectProblem(await api.answerReview(review, { option: 'approve' }), 409, 'invalid_state')
})

test('sends the run back when the analysis is rejected with feedback', async ({ api, client }) => {
  const { run } = await api.startRun(idea, { reviews: [reviewNodes.analysis] })
  const review = await api.waitForReview(run.id)

  expectAccepted(
    await api.answerReview(review, {
      option: 'reject_reanalyse',
      feedback: 'List the rules for cancelling a booking.',
    }),
  )

  const next = await api.waitForReview(run.id)
  expect(next.id).not.toBe(review.id)
  const directives = await client.get<{ items: { kind: string; instruction: string }[] }>(
    `/runs/${run.id}/directives`,
  )
  expect(directives.body.items.map((directive) => directive.instruction)).toContain(
    'List the rules for cancelling a booking.',
  )
})

test('goes on to the end when every review is approved', async ({ api }) => {
  const { run } = await api.startRun(idea, {
    reviews: Object.values(reviewNodes),
  })

  const finished = await api.approveEveryReview(run.id)

  expect(finished.status).toBe('succeeded')
  expect(finished.error).toBeNull()
})
