import { expect, test } from '@playwright/test'

import { PROJECT_IDS } from '../../src/mocks/shared/mock-ids.constants'

const settingsPath = `/projects/${PROJECT_IDS.mentor}/settings`

test('saves a change of the general settings, which the project list shows', async ({ page }) => {
  await page.goto(settingsPath)
  const name = page.getByLabel('Name')
  await expect(name).toHaveValue('Mentor platform', { timeout: 20_000 })

  await name.fill('Mentor hub')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Saved')).toBeVisible()

  await page.goto('/projects')
  await expect(page.getByRole('link', { name: /Mentor hub/ })).toBeVisible({ timeout: 20_000 })
})

test('builds the run settings from the workflow, and shows what the server rejects', async ({
  page,
}) => {
  await page.goto(`${settingsPath}?section=runs`)
  await expect(page.getByLabel('Max turns')).toBeVisible({ timeout: 20_000 })

  await page.getByLabel('Max personas').fill('2')
  await page.getByLabel('Target personas num').fill('5')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Must not be lower than target_personas_num.')).toBeVisible()
})

test('chooses the model of a role', async ({ page }) => {
  await page.goto(`${settingsPath}?section=models`)
  await page.getByLabel('Analyst').selectOption('anthropic:claude-opus-5-5', { timeout: 20_000 })
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Saved')).toBeVisible()
})

test('opens the run settings from the console with /run-settings', async ({ page }) => {
  await page.goto(`/projects/${PROJECT_IDS.mentor}/console`)
  const input = page.getByRole('combobox', { name: 'Message' })
  await input.fill('/run-settings ')
  await input.press('Enter')

  await expect(page).toHaveURL(/settings\?section=runs$/, { timeout: 20_000 })
  await expect(page.getByLabel('Max turns')).toBeVisible()
})
