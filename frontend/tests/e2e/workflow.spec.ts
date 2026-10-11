import { expect, test } from '@playwright/test'

import { PROJECT_IDS, RUN_IDS } from '../../src/mocks/mock-ids.constants'
import { mockRunSteps } from '../../src/mocks/runs.fixtures'

/** The first step of run 1, which the mock data keeps. */
const mockStepId = mockRunSteps(RUN_IDS.mentorMain1, 'done')[0]?.id ?? ''
const workflowPath = `/projects/${PROJECT_IDS.mentor}/workflow`

test('offers the newest run when none is chosen, and opens it with its graph', async ({ page }) => {
  await page.goto(workflowPath)

  await expect(page.getByRole('heading', { name: 'Choose a run' })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('link', { name: 'Open Run 3' }).click()

  await expect(page).toHaveURL(new RegExp(`/workflow/${RUN_IDS.mentorMain3}$`), { timeout: 20_000 })
  await expect(page.getByText(/Run 3: waiting for review - /)).toBeVisible()
  await expect(page.getByLabel(/, waiting/)).toBeVisible({ timeout: 20_000 })
})

test('opens a step from the side panel, with what it made, and offers the review', async ({
  page,
}) => {
  await page.goto(`${workflowPath}/${RUN_IDS.mentorMain3}`)
  const steps = page.getByRole('list', { name: 'Steps of Run 3' })
  await expect(steps).toBeVisible({ timeout: 20_000 })

  await steps.getByRole('link').last().click()

  const step = page.getByRole('region', { name: 'Chosen step' })
  await expect(step).toContainText('waiting for review')
  await expect(step.getByRole('button', { name: 'Retry from this step' })).toBeDisabled()
  await step.getByRole('link', { name: 'Open review' }).click()
  await expect(page).toHaveURL(new RegExp(`/review/${RUN_IDS.mentorMain3}$`), { timeout: 20_000 })
})

test('retries a finished run from a step, which starts a new run', async ({ page }) => {
  // The step is in the address, which keeps the state of the mock data that the address names.
  await page.goto(`${workflowPath}/${RUN_IDS.mentorMain1}?mock-run-state=done&step=${mockStepId}`)

  const step = page.getByRole('region', { name: 'Chosen step' })
  await expect(step).toBeVisible()
  await step.getByRole('button', { name: 'Retry from this step' }).click()

  await expect(page).toHaveURL(new RegExp(`/workflow/(?!${RUN_IDS.mentorMain1})[^/?]+$`), {
    timeout: 20_000,
  })
})
