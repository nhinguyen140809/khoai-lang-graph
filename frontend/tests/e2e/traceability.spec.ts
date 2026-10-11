import { expect, test } from '@playwright/test'

import { PROJECT_IDS } from '../../src/mocks/mock-ids.constants'

const tracePath = `/projects/${PROJECT_IDS.mentor}/traceability`

test('shows the matrix, and keeps the rows of a gap that is chosen in the side panel', async ({
  page,
}) => {
  await page.goto(tracePath)
  const table = page.getByRole('table', { name: 'Traceability matrix' })
  await expect(table.getByRole('link', { name: 'US-002' })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('link', { name: /No source/ }).click()

  await expect(page).toHaveURL(/gap=no_source/, { timeout: 20_000 })
  await expect(table.getByRole('link', { name: 'REQ-009' })).toBeVisible()
  await expect(table.getByRole('link', { name: 'US-002' })).toBeHidden()
})

test('opens an item of the matrix in Artifacts', async ({ page }) => {
  await page.goto(tracePath)
  await page
    .getByRole('table', { name: 'Traceability matrix' })
    .getByRole('link', { name: 'REQ-001' })
    .click({ timeout: 20_000 })

  await expect(page).toHaveURL(/\/artifacts\/items\//, { timeout: 20_000 })
})

test('lists the open issues', async ({ page }) => {
  await page.goto(tracePath)
  await page.getByRole('link', { name: 'Issues' }).click({ timeout: 20_000 })

  await expect(page.getByRole('region', { name: 'Conflicts' })).toContainText('CONF-001', {
    timeout: 20_000,
  })
})
