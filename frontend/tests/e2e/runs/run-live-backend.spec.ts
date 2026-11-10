import { expect } from '@playwright/test'

import { test } from '../../shared/fixtures.utils'
import { idea, slowCallSeconds } from './run-live-backend.data'

test('fills the documents panel as the run writes, without a reload', async ({
  api,
  page,
  user,
}) => {
  await api.setModelDelay(slowCallSeconds)
  try {
    const { projectId, run } = await api.startRun(idea)
    await page.goto(`/projects/${projectId}/documents`)
    await user.expectRunStatus('Working')
    await user.expectRole('treeitem', 'Elicitation plan')
    const before = await page.getByRole('treeitem').count()

    await api.setModelDelay(0)
    await api.waitForRun(run.id, ['succeeded'])

    await user.expectRunStatus('Done')
    await expect.poll(() => page.getByRole('treeitem').count()).toBeGreaterThan(before)
    await user.expectRole('treeitem', 'Requirement specification')
  } finally {
    await api.setModelDelay(0)
  }
})

test('grows the trace panel as the run writes, without a reload', async ({ api, page, user }) => {
  await api.setModelDelay(slowCallSeconds)
  try {
    const { projectId, run } = await api.startRun(idea)
    await page.goto(`/projects/${projectId}/trace`)
    await user.openSidePanel('Trace')
    await user.expectRunStatus('Working')
    const before = await page.getByRole('treeitem').count()

    await api.setModelDelay(0)
    await api.waitForRun(run.id, ['succeeded'])

    await user.expectRunStatus('Done')
    await expect.poll(() => page.getByRole('treeitem').count()).toBeGreaterThan(before)
  } finally {
    await api.setModelDelay(0)
  }
})

test('shows the stage that the run is at and ends at Done on the activity page', async ({
  api,
  page,
  user,
}) => {
  await api.setModelDelay(slowCallSeconds)
  try {
    const { projectId, run } = await api.startRun(idea)
    await user.openActivity(projectId)
    await user.expectRunStatus(/Working: /)
    await expect(page.getByText('Planning the interviews').first()).toBeVisible()

    await api.setModelDelay(0)
    await api.waitForRun(run.id, ['succeeded'])

    await user.expectRunStatus('Done')
  } finally {
    await api.setModelDelay(0)
  }
})
