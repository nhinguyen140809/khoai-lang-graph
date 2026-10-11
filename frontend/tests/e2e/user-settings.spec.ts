import { expect, test } from '@playwright/test'

test('opens the settings of the user from the account menu, and saves the name', async ({
  page,
}) => {
  await page.goto('/projects')
  await page.getByRole('button', { name: /Account/ }).click({ timeout: 20_000 })
  await page.getByRole('menuitem', { name: 'Your settings' }).click()

  await expect(page).toHaveURL(/\/settings$/, { timeout: 20_000 })
  const name = page.getByLabel('Name')
  await expect(name).toHaveValue('Linh Pham', { timeout: 20_000 })
  await name.fill('Linh P.')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Saved')).toBeVisible()
})

test('shows the usage of the user, grouped by another field', async ({ page }) => {
  await page.goto('/settings?section=usage')
  await expect(page.getByRole('table', { name: 'Usage' })).toBeVisible({ timeout: 20_000 })

  await page.getByLabel('Group by').selectOption('model')

  await expect(page.getByRole('cell', { name: 'anthropic:claude-opus-5-5' })).toBeVisible()
})

test('signs out another login session', async ({ page }) => {
  await page.goto('/settings?section=sessions')
  const list = page.getByRole('list', { name: 'Login sessions' })
  await expect(list.getByRole('listitem')).toHaveCount(3, { timeout: 20_000 })

  await list.getByRole('button', { name: 'Sign out Safari 19 on iPhone' }).click()

  await expect(list.getByRole('listitem')).toHaveCount(2)
})

test('chooses the model of a role for every project', async ({ page }) => {
  await page.goto('/settings?section=models')
  await page
    .getByLabel('Planner', { exact: true })
    .selectOption('anthropic:claude-sonnet-5-5', { timeout: 20_000 })
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Saved')).toBeVisible()
})
