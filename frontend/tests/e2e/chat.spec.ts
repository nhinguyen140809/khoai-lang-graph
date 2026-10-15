import { expect, test } from '@playwright/test'

import { THREAD_IDS } from '../../src/mocks/shared/mock-ids.constants'

test('sends a message and streams the agent reply', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('tab', { name: 'Graph' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Message' }).fill('Summarize the plan')
  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByText('Summarize the plan')).toBeVisible()
  await expect(page.getByText(/Hello from the/)).toBeVisible()
  await expect(page.getByText('mock', { exact: true })).toBeVisible()
})

test('lists the threads and opens one', async ({ page }) => {
  await page.goto('/')

  // Every project of the mock data has one thread, named Main thread; the mentor platform's is first.
  await page.getByRole('link', { name: 'Main thread' }).first().click()

  await expect(page).toHaveURL(new RegExp(`/threads/${THREAD_IDS.mentorMain}$`))
  await expect(page.getByRole('textbox', { name: 'Message' })).toBeVisible()
})

test('shows an error with a retry when the threads fail to load', async ({ page }) => {
  await page.goto('/?mock-threads=error')

  // Next.js adds its own empty role="alert" element (the route announcer), so match by text.
  const alert = page.getByRole('alert').filter({ hasText: 'Failed to load threads' })
  await expect(alert).toBeVisible()
  await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible()
})

test('shows the empty state when there are no threads', async ({ page }) => {
  await page.goto('/?mock-threads=empty')

  await expect(page.getByText('No threads yet')).toBeVisible()
})

test('navigates to settings and switches theme', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Settings' }).click()

  await page.getByRole('button', { name: 'Dark' }).click()

  await expect(page.locator('html')).toHaveClass(/dark/)
})
