import { expect, test } from '@playwright/test'

test('sends a message and streams the agent reply', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('tab', { name: 'Graph' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Message' }).fill('Summarize the plan')
  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByText('Summarize the plan')).toBeVisible()
  await expect(page.getByText(/Hello from the/)).toBeVisible()
  await expect(page.getByText('mock', { exact: true })).toBeVisible()
})

test('navigates to settings and switches theme', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Settings' }).click()

  await page.getByRole('button', { name: 'Dark' }).click()

  await expect(page.locator('html')).toHaveClass(/dark/)
})
