import { expect, type Page, test } from '@playwright/test'

import { refusedFormCases, sentFormCases, switchCases } from './account.data'

async function fill(page: Page, fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    await page.getByLabel(label, { exact: true }).fill(value)
  }
}

for (const { name, address, fields, submit, opens } of sentFormCases) {
  test(name, async ({ page }) => {
    await page.goto(address)

    await fill(page, fields)
    await page.getByRole('button', { name: submit }).click()

    // The dev server renders the page on the first visit, which can be slow.
    await expect(page).toHaveURL(opens, { timeout: 20_000 })
  })
}

for (const { name, address, fields, submit, message, stays } of refusedFormCases) {
  test(name, async ({ page }) => {
    await page.goto(address)

    await fill(page, fields)
    await page.getByRole('button', { name: submit }).click()

    await expect(page.getByRole('alert').filter({ hasText: message })).toHaveText(message)
    await expect(page).toHaveURL(stays)
  })
}

for (const { name, address, link, opens } of switchCases) {
  test(name, async ({ page }) => {
    await page.goto(address)

    await page.getByRole('link', { name: link }).click()

    await expect(page).toHaveURL(opens, { timeout: 20_000 })
  })
}
