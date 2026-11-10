import { expect } from '@playwright/test'

import { test } from '../../shared/fixtures.utils'
import { idea, reviewStops } from './runs-backend.data'

test('stops at each review of a new project and finishes after the last answer', async ({
  page,
  user,
}) => {
  await user.startProject(idea)

  for (const { status, prompt, approve } of reviewStops) {
    await user.expectRunStatus(`Waiting for you: ${status}`)
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
