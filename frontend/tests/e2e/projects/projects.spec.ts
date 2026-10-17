import { expect, test } from '@playwright/test'

import { createdProjectCases, listCases, notFoundCases, openedProjectCases } from './projects.data'

const prompt = 'What product do you want to write the requirements for?'

for (const { name, from, status, id } of openedProjectCases) {
  test(`opens ${name} from the list at its activity`, async ({ page }) => {
    await page.goto(from)

    // The dev server renders the page on the first visit, which can be slow.
    await expect(page).toHaveURL(/\/projects$/, { timeout: 20_000 })
    const row = page.getByRole('row', { name: new RegExp(name) })
    await expect(row.getByRole('cell', { name: status })).toBeVisible()
    await page.getByRole('link', { name }).click()

    await expect(page).toHaveURL(new RegExp(`/projects/${id}/activity$`), { timeout: 20_000 })
    await expect(page.getByRole('banner').getByRole('button', { name })).toBeVisible()
  })
}

for (const { name, idea, typedName, shownName } of createdProjectCases) {
  test(`${name}, and opens its activity`, async ({ page }) => {
    await page.goto('/projects')

    await page.getByRole('textbox', { name: prompt }).fill(idea)
    await page.getByRole('main').getByRole('button', { name: 'Create project' }).click()
    const dialog = page.getByRole('dialog', { name: 'Create project' })
    await expect(dialog.getByRole('textbox', { name: 'Idea' })).toHaveValue(idea)
    await dialog.getByRole('textbox', { name: 'Name (optional)' }).fill(typedName)
    await dialog.getByRole('button', { name: 'Create project' }).click()

    await expect(page).toHaveURL(/\/projects\/[^/]+\/activity$/, { timeout: 20_000 })
    await expect(page.getByRole('banner').getByRole('button', { name: shownName })).toBeVisible()
  })
}

for (const { name, archived, shows, hides } of listCases) {
  test(name, async ({ page }) => {
    await page.goto('/projects')

    if (archived) await page.getByRole('button', { name: 'Archived' }).click()

    await expect(page.getByRole('link', { name: shows })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('link', { name: hides })).toHaveCount(0)
  })
}

for (const { name, address } of notFoundCases) {
  test(`shows ${name} as not found`, async ({ page }) => {
    await page.goto(address)

    await expect(page.getByRole('heading', { name: 'Project not found' })).toBeVisible({
      timeout: 20_000,
    })
    await page.getByRole('link', { name: 'All projects' }).click()
    await expect(page).toHaveURL(/\/projects$/)
  })
}
