import { expect, test } from '@playwright/test'

import { PROJECT_IDS } from '../../src/mocks/mock-ids.constants'

const consolePath = `/projects/${PROJECT_IDS.mentor}/console`

test('Ctrl+K opens the command palette, which goes to a feature', async ({ page }) => {
  await page.goto(consolePath)
  // The page listens for the shortcut once it has loaded its event log.
  await expect(page.getByRole('log', { name: 'Event log' })).toBeVisible()

  await page.keyboard.press('Control+k')
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await palette.getByRole('combobox').fill('artifacts')
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(new RegExp(`/projects/${PROJECT_IDS.mentor}/artifacts$`), {
    // The dev server renders the page of another feature on the first visit, which can be slow.
    timeout: 15_000,
  })
  await expect(page.getByRole('complementary', { name: 'Artifacts' })).toBeVisible()
})

test('Ctrl+B hides and shows the side panel', async ({ page }) => {
  await page.goto(`/projects/${PROJECT_IDS.mentor}/search`)
  const sidePanel = page.getByRole('complementary', { name: 'Search' })
  await expect(sidePanel).toBeVisible()

  await page.keyboard.press('Control+b')
  await expect(sidePanel).toHaveCount(0)

  await page.keyboard.press('Control+b')
  await expect(sidePanel).toBeVisible()
})

test('the activity bar returns to the last page open in Console', async ({ page }) => {
  await page.goto(consolePath)

  const features = page.getByRole('navigation', { name: 'Features' })
  await features.getByRole('link', { name: 'Workflow' }).click()
  await expect(page.getByRole('complementary', { name: 'Runs' })).toBeVisible()
  await features.getByRole('link', { name: /^Console/ }).click()

  await expect(page).toHaveURL(new RegExp(`/projects/${PROJECT_IDS.mentor}/console$`), {
    // The dev server renders the page of another feature on the first visit, which can be slow.
    timeout: 15_000,
  })
})

for (const [state, label] of [
  ['running', 'Run 3: running'],
  ['failed', 'Run 3: failed'],
  ['done', 'Run 3: done'],
] as const) {
  test(`the status bar shows a run that is ${state}`, async ({ page }) => {
    await page.goto(`${consolePath}?mock-run-state=${state}`)

    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: new RegExp(label) }),
    ).toBeVisible()
  })
}

test('the tabs of a project stay open when the feature changes, and the review is one tab', async ({
  page,
}) => {
  await page.goto(`/projects/${PROJECT_IDS.mentor}/console`)
  const tabs = page.getByRole('navigation', { name: 'Open editors' })
  await expect(tabs.getByRole('link', { name: 'Console' })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('link', { name: 'Open the review' }).click()
  await expect(tabs.getByRole('link', { name: 'Review' })).toBeVisible({ timeout: 20_000 })

  const features = page.getByRole('navigation', { name: 'Features' })
  await features.getByRole('link', { name: 'Workflow' }).click()
  await expect(page).toHaveURL(/\/workflow/, { timeout: 20_000 })

  // The tabs of Console and of the review are still there, in the strip of Workflow.
  await expect(tabs.getByRole('link', { name: 'Console' })).toBeVisible()
  await expect(tabs.getByRole('link', { name: 'Review' })).toBeVisible()

  await tabs.getByRole('link', { name: 'Review' }).click()
  await expect(page).toHaveURL(/\/review\//, { timeout: 20_000 })
  await expect(page.getByRole('region', { name: 'Review' })).toBeVisible({ timeout: 20_000 })
})
