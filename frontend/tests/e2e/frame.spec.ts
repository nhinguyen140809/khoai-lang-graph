import { expect, test } from '@playwright/test'

import { PROJECT_IDS } from '../../src/mocks/mock-ids.constants'

const consolePath = `/projects/${PROJECT_IDS.mentor}/console`

test('Ctrl+K opens the command palette, which shows the side panel of a feature', async ({
  page,
}) => {
  await page.goto(consolePath)
  // The page listens for the shortcut once it has loaded its event log.
  await expect(page.getByRole('log', { name: 'Event log' })).toBeVisible()

  await page.keyboard.press('Control+k')
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await palette.getByRole('combobox').fill('artifacts')
  await page.keyboard.press('Enter')

  await expect(page.getByRole('complementary', { name: 'Artifacts' })).toBeVisible({
    timeout: 15_000,
  })
  // The editor stays on the page it showed.
  await expect(page).toHaveURL(new RegExp(`/projects/${PROJECT_IDS.mentor}/console$`))
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

test('drags the edge of the side panel to make it wider', async ({ page }) => {
  await page.goto(`/projects/${PROJECT_IDS.mentor}/search`)
  const sidePanel = page.getByRole('complementary', { name: 'Search' })
  await expect(sidePanel).toBeVisible()
  const before = (await sidePanel.boundingBox())?.width ?? 0
  const edge = await page.getByRole('separator').first().boundingBox()
  if (edge === null) throw new Error('The side panel has no edge to drag')

  // Every step of the drag moves the edge, not only the first one.
  const x = edge.x + edge.width / 2
  const y = edge.y + edge.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 120, y, { steps: 10 })
  await page.mouse.up()

  await expect
    .poll(async () => (await sidePanel.boundingBox())?.width ?? 0)
    .toBeGreaterThan(before + 80)
})

test('the activity bar changes the side panel and leaves the editor as it is', async ({ page }) => {
  await page.goto(consolePath)
  const tabs = page.getByRole('navigation', { name: 'Open editors' })
  await expect(tabs.getByRole('link', { name: 'Console' })).toBeVisible({ timeout: 20_000 })

  const features = page.getByRole('navigation', { name: 'Features' })
  await features.getByRole('button', { name: 'Workflow' }).click()
  await expect(page.getByRole('complementary', { name: 'Runs' })).toBeVisible()
  await features.getByRole('button', { name: /^Console/ }).click()
  await expect(page.getByRole('complementary', { name: 'Console' })).toBeVisible()

  await expect(page).toHaveURL(new RegExp(`/projects/${PROJECT_IDS.mentor}/console$`))
  await expect(tabs.getByRole('link', { name: 'Console' })).toBeVisible()
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

test('the tabs of a project stay open when the side panel changes, and the review is one tab', async ({
  page,
}) => {
  await page.goto(`/projects/${PROJECT_IDS.mentor}/console`)
  const tabs = page.getByRole('navigation', { name: 'Open editors' })
  await expect(tabs.getByRole('link', { name: 'Console' })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('link', { name: 'Open the review' }).click()
  await expect(tabs.getByRole('link', { name: 'Review' })).toBeVisible({ timeout: 20_000 })

  const features = page.getByRole('navigation', { name: 'Features' })
  await features.getByRole('button', { name: 'Workflow' }).click()
  await expect(page.getByRole('complementary', { name: 'Runs' })).toBeVisible()

  // The tabs of Console and of the review are still there, and so is the page of the review.
  await expect(page).toHaveURL(/\/review\//)
  await expect(tabs.getByRole('link', { name: 'Console' })).toBeVisible()
  await expect(tabs.getByRole('link', { name: 'Review' })).toBeVisible()

  await tabs.getByRole('link', { name: 'Review' }).click()
  await expect(page).toHaveURL(/\/review\//, { timeout: 20_000 })
  await expect(page.getByRole('region', { name: 'Review' })).toBeVisible({ timeout: 20_000 })
})
