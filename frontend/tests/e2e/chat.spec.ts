import { expect, test } from '@playwright/test'

import { PROJECT_IDS, THREAD_IDS } from '../../src/mocks/mock-ids.constants'

const chat = `/projects/${PROJECT_IDS.mentor}/chat`
const mainThread = `${chat}/${THREAD_IDS.mentorMain}`

test('sends a message and streams the agent reply', async ({ page }) => {
  await page.goto(mainThread)

  await page.getByRole('textbox', { name: 'Message' }).fill('Summarize the plan')
  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByText('Summarize the plan')).toBeVisible()
  await expect(page.getByText(/Hello from the/)).toBeVisible()
  await expect(page.getByText('mock', { exact: true })).toBeVisible()
})

test('lists the threads and opens one in a tab', async ({ page }) => {
  await page.goto(mainThread)
  const tabs = page.getByRole('navigation', { name: 'Open editors' })
  await expect(tabs.getByRole('link', { name: 'Main thread' })).toBeVisible()

  await page
    .getByRole('complementary', { name: 'Threads' })
    .getByRole('link', { name: /Booking rules/ })
    .click()

  // The dev server renders the page of another thread on the first visit, which can be slow.
  await expect(page).toHaveURL(new RegExp(`${THREAD_IDS.mentorBooking}$`), { timeout: 15_000 })
  await expect(tabs.getByRole('link', { name: 'Booking rules' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(tabs.getByRole('link', { name: 'Main thread' })).toBeVisible()
})

test('shows an error with a retry when the threads fail to load', async ({ page }) => {
  await page.goto(`${chat}?mock-threads=error`)

  // Next.js adds its own empty role="alert" element (the route announcer), so match by text.
  const threads = page.getByRole('complementary', { name: 'Threads' })
  const alert = threads.getByRole('alert').filter({ hasText: 'Failed to load threads' })
  await expect(alert).toBeVisible()
  await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible()
})

test('shows the empty state when there are no threads', async ({ page }) => {
  await page.goto(`${chat}?mock-threads=empty`)

  await expect(page.getByText('No threads yet')).toBeVisible()
})

test('switches the theme from the account menu', async ({ page }) => {
  await page.goto(chat)

  await page.getByRole('button', { name: /Account/ }).click()
  await page.getByRole('menuitemradio', { name: 'Light' }).click()

  await expect(page.locator('html')).not.toHaveClass(/dark/)
})
