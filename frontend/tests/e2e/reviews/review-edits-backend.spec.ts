import { expect } from '@playwright/test'

import { type ApiPage, type ApiSteps, expectOk } from '../../shared/api'
import { test } from '../../shared/fixtures.utils'
import { reviewNodes } from '../../shared/reviews.constants'
import { editedStatement, idea, itemStates } from './review-edits-backend.data'

/** A run that waits at the review of the analysis, and a requirement of that analysis. */
async function waitingAnalysis(api: ApiSteps) {
  const { projectId, run } = await api.startRun(idea, { reviews: [reviewNodes.analysis] })
  const review = await api.waitForReview(run.id)
  const items = await api.listItems(review.review_artifacts[0]?.artifact_id ?? '')
  const target = items.find((item) => item.kind === 'analyzed_requirement')
  if (target === undefined) throw new Error('The analysis has no requirement to edit.')
  return { projectId, run, review, target }
}

test('marks what waits for the review in the panel and on the document', async ({
  api,
  page,
  user,
}) => {
  const { projectId, review } = await waitingAnalysis(api)

  await page.goto(
    `/projects/${projectId}/documents/${review.review_artifacts[0]?.artifact_id ?? ''}`,
  )

  await user.expectText(itemStates.waiting)
  await user.expectText(/\d+ to review/)
})

test('edits a requirement while the review waits and keeps the edit in the answer', async ({
  api,
  client,
  page,
  user,
}) => {
  const { projectId, run, review, target } = await waitingAnalysis(api)
  await user.openItem(projectId, target.id)

  await user.startEditingItem()
  await user.fillItemField('Statement', editedStatement)
  await user.saveItem()

  await user.expectText(itemStates.edited)
  await user.expectText('version 2')
  const saved = (await api.listItems(review.review_artifacts[0]?.artifact_id ?? '')).find(
    (item) => item.id === target.id,
  )
  expect(saved?.content.statement).toBe(editedStatement)
  await user.openActivity(projectId)
  await user.expectReviewPrompt(/requirements analysis/)
  await user.answerReviewWith('Approve analysis')
  await user.expectRunStatus('Done')
  const interrupts = expectOk(
    await client.get<ApiPage<{ id: string; decision?: { option: string } }>>(
      `/runs/${run.id}/interrupts`,
    ),
  )
  expect(interrupts.items.find((entry) => entry.id === review.id)?.decision?.option).toBe('accept')
  const kept = (await api.listItems(review.review_artifacts[0]?.artifact_id ?? '')).find(
    (item) => item.id === target.id,
  )
  expect(kept?.content.statement).toBe(editedStatement)
  await expect(page.getByText(/to review/)).toHaveCount(0)
})

test('leaves the requirement as it was when the edit is discarded', async ({ api, user }) => {
  const { projectId, review, target } = await waitingAnalysis(api)
  await user.openItem(projectId, target.id)

  await user.startEditingItem()
  await user.fillItemField('Statement', editedStatement)
  await user.discardItemEdit()

  await user.expectText(itemStates.waiting)
  const kept = (await api.listItems(review.review_artifacts[0]?.artifact_id ?? '')).find(
    (item) => item.id === target.id,
  )
  expect(kept?.version).toBe(target.version)
})

test('disables the edit once the run has gone on', async ({ api, page, user }) => {
  const { projectId, run, review, target } = await waitingAnalysis(api)
  await api.resumeRun(review, { option: 'accept' })
  await api.waitForRun(run.id, ['succeeded'])

  await user.openItem(projectId, target.id)

  await page.getByRole('button', { name: 'More actions' }).first().click()
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeDisabled()
})
