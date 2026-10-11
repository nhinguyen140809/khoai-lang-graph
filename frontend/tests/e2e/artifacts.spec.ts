import { expect, test } from '@playwright/test'

import { PROJECT_IDS } from '../../src/mocks/mock-ids.constants'

const artifacts = `/projects/${PROJECT_IDS.mentor}/artifacts`

test('opens an artifact as a document and one of its items in a tab', async ({ page }) => {
  await page.goto(artifacts)
  const tree = page.getByRole('complementary', { name: 'Artifacts' })

  await tree.getByRole('link', { name: /Requirement specification/ }).click()

  await expect(page.getByRole('heading', { name: 'Requirement specification' })).toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByRole('heading', { name: /3\.1\s*Mentor discovery/ })).toBeVisible()
  await page.getByRole('link', { name: 'Search mentors' }).first().click()

  await expect(page).toHaveURL(/\/artifacts\/items\//, { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: /REQ-001\s*Search mentors/ })).toBeVisible()
  const tabs = page.getByRole('navigation', { name: 'Open editors' })
  await expect(tabs.getByRole('link', { name: 'REQ-001' })).toBeVisible()
  await expect(tabs.getByRole('link', { name: 'Requirement specification' })).toBeVisible()
})

test('edits an item, which becomes a new version', async ({ page }) => {
  await page.goto(artifacts)
  await page
    .getByRole('complementary', { name: 'Artifacts' })
    .getByRole('button', { name: 'Open Requirement specification' })
    .click()
  await page.getByRole('link', { name: /Filter by field and availability/ }).click()
  await expect(page).toHaveURL(/\/artifacts\/items\//, { timeout: 20_000 })

  await page.getByRole('button', { name: 'Edit' }).click()
  const title = page.getByLabel('Title *')
  await title.fill('Narrow the list')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('heading', { name: /Narrow the list/ })).toBeVisible()
  await expect(page.getByText('v3', { exact: true })).toBeVisible()
  await expect(page.getByText(/Edited by you/)).toBeVisible()

  await page.getByRole('tab', { name: 'Timeline' }).click()
  await expect(
    page.getByRole('list', { name: 'Versions' }).getByText(/edited by you/),
  ).toBeVisible()
})

test('shows the trace of an item, with a link made from an older version', async ({ page }) => {
  await page.goto(artifacts)
  await page
    .getByRole('complementary', { name: 'Artifacts' })
    .getByRole('button', { name: 'Open Requirement specification' })
    .click()
  await page
    .getByRole('link', { name: /Book a session/ })
    .first()
    .click()

  const outgoing = page.getByRole('list', { name: 'Outgoing links' })
  await expect(outgoing.getByText('Derived from')).toBeVisible({ timeout: 20_000 })
  await expect(outgoing.getByText(/made from v1/)).toBeVisible()
})

test('exports the artifacts from the command of the console', async ({ page }) => {
  await page.goto(`/projects/${PROJECT_IDS.mentor}/console`)
  const input = page.getByRole('combobox', { name: 'Message' })
  await expect(page.getByRole('log', { name: 'Event log' })).toBeVisible()

  await input.fill('/export')
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog', { name: 'Export' })
  await expect(dialog).toBeVisible({ timeout: 20_000 })
  await expect(page).toHaveURL(/\/artifacts\?export/)
  await dialog.getByRole('button', { name: 'Export' }).click()
  await expect(
    dialog.getByRole('link', { name: /Download requirement_specification\.md/ }),
  ).toBeVisible({
    timeout: 10_000,
  })
})

test('shows an error with a retry when the artifacts fail to load', async ({ page }) => {
  await page.goto(`${artifacts}?mock-artifacts=error`)

  const alert = page.getByRole('alert').filter({ hasText: 'Failed to load the artifacts' })
  await expect(alert).toBeVisible()
  await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible()
})
