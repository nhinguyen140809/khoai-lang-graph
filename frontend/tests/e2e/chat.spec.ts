import { expect, test } from '@playwright/test'

import { PROJECT_IDS } from '../../src/mocks/mock-ids.constants'

const chat = `/projects/${PROJECT_IDS.mentor}/chat`

test('sends a message and streams the run log of the reply', async ({ page }) => {
  await page.goto(chat)

  await page.getByRole('textbox', { name: 'Message' }).fill('Summarize the plan')
  await page.getByRole('button', { name: 'Send' }).click()

  // The prompt prints as a terminal line, then the run follows: a node, its text and artifact,
  // and the mark the run ends with.
  await expect(page.getByText('Summarize the plan')).toBeVisible()
  await expect(page.getByText('planner').first()).toBeVisible()
  await expect(page.getByText(/An elicitation plan for the/)).toBeVisible()
  await expect(page.getByText(/created Elicitation plan/)).toBeVisible()
  await expect(page.getByText('✓ done')).toBeVisible()
})

test('shows an error with a retry when the conversation fails to load', async ({ page }) => {
  await page.goto(`${chat}?mock-threads=error`)

  // Next.js adds its own empty role="alert" element (the route announcer), so match by text.
  const alert = page.getByRole('alert').filter({ hasText: 'Failed to load the conversation' })
  await expect(alert).toBeVisible()
  await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible()
})

test('starts an empty conversation when the project has no thread', async ({ page }) => {
  await page.goto(`${chat}?mock-threads=empty`)

  await expect(page.getByRole('textbox', { name: 'Message' })).toBeVisible()
  await expect(page.getByPlaceholder('Give the agents a task...')).toBeVisible()
})

test('switches the theme from the account menu', async ({ page }) => {
  await page.goto(chat)

  await page.getByRole('button', { name: /Account/ }).click()
  await page.getByRole('menuitemradio', { name: 'Light' }).click()

  await expect(page.locator('html')).not.toHaveClass(/dark/)
})
