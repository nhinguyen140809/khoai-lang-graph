import { expect, test } from '@playwright/test'

import { PROJECT_IDS } from '../../src/mocks/mock-ids.constants'

const chat = `/projects/${PROJECT_IDS.mentor}/chat`

test('Ctrl+K opens the command palette, which goes to a feature', async ({ page }) => {
  await page.goto(chat)

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

test('the activity bar returns to the last page open in Chat', async ({ page }) => {
  await page.goto(chat)

  const features = page.getByRole('navigation', { name: 'Features' })
  await features.getByRole('link', { name: 'Workflow' }).click()
  await expect(page.getByRole('complementary', { name: 'Runs' })).toBeVisible()
  await features.getByRole('link', { name: /^Chat/ }).click()

  await expect(page).toHaveURL(new RegExp(`/projects/${PROJECT_IDS.mentor}/chat$`))
})

for (const [state, label] of [
  ['running', 'Run 3: running'],
  ['failed', 'Run 3: failed'],
  ['done', 'Run 3: done'],
] as const) {
  test(`the status bar shows a run that is ${state}`, async ({ page }) => {
    await page.goto(`${chat}?mock-run-state=${state}`)

    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: new RegExp(label) }),
    ).toBeVisible()
  })
}
