import { expect, test } from '@playwright/test'

import { PROJECT_IDS } from '../../src/mocks/shared/mock-ids.constants'

test('opens a project from the list at Console, with its run on the status bar', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/projects$/)
  const mentor = page.getByRole('row', { name: /Mentor platform/ })
  await expect(mentor.getByRole('cell', { name: 'Waiting for review' })).toBeVisible()
  await page.getByRole('link', { name: 'Mentor platform' }).click()

  await expect(page).toHaveURL(new RegExp(`/projects/${PROJECT_IDS.mentor}/console$`))
  await expect(page.getByRole('link', { name: /Run 3: waiting for review/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Console\b.*1 review waiting/ })).toBeVisible()
})

test('creates a project and opens its console', async ({ page }) => {
  await page.goto('/projects')

  await page.getByRole('main').getByRole('button', { name: 'New project' }).click()
  const dialog = page.getByRole('dialog', { name: 'New project' })
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Thesis tracker')
  await dialog.getByRole('button', { name: 'Create project' }).click()

  await expect(page).toHaveURL(/\/projects\/[^/]+\/console$/)
  await expect(
    page.getByRole('banner').getByRole('button', { name: 'Thesis tracker' }),
  ).toBeVisible()
  await expect(page.getByText('No runs yet')).toBeVisible()
})

test('lists the archived projects', async ({ page }) => {
  await page.goto('/projects')

  await page.getByRole('button', { name: 'Archived' }).click()

  await expect(page.getByRole('link', { name: 'Dorm laundry booking' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mentor platform' })).toHaveCount(0)
})

test('shows a project that does not exist as not found', async ({ page }) => {
  await page.goto('/projects/missing/console')

  await expect(page.getByRole('heading', { name: 'Project not found' })).toBeVisible()
  await page.getByRole('link', { name: 'All projects' }).click()
  await expect(page).toHaveURL(/\/projects$/)
})
