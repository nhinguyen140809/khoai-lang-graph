import { expect, type Page, test } from '@playwright/test'

import { PROJECT_IDS } from '../../src/mocks/mock-ids.constants'

async function signOut(page: Page) {
  await page.getByRole('button', { name: /Account/ }).click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)
}

test('signing out leads to the sign-in page, which returns to the page asked for', async ({
  page,
}) => {
  await page.goto('/projects')
  await signOut(page)

  await page.goto(`/projects/${PROJECT_IDS.mentor}/console`)
  // The dev server renders the page on the first visit, which can be slow.
  await expect(page).toHaveURL(/\/login\?next=%2Fprojects%2F/, { timeout: 20_000 })

  await page.getByLabel('Email').fill('linh.pham@example.com')
  await page.getByLabel('Password').fill('secret')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(new RegExp(`/projects/${PROJECT_IDS.mentor}/console$`))
  await expect(page.getByRole('combobox', { name: 'Message' })).toBeVisible()
})

test('creates an account and opens the projects with it', async ({ page }) => {
  await page.goto('/projects')
  await signOut(page)

  await page.getByRole('link', { name: 'Create an account' }).click()
  await page.getByLabel('Name').fill('An Tran')
  await page.getByLabel('Email').fill('an@example.com')
  await page.getByLabel('Password').fill('secret')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL(/\/projects$/)
  await page.getByRole('button', { name: /Account/ }).click()
  await expect(page.getByRole('menu')).toContainText('an@example.com')
})

test('says when the email or the password is wrong', async ({ page }) => {
  await page.goto('/login?mock-login=error')

  await page.getByLabel('Email').fill('linh.pham@example.com')
  await page.getByLabel('Password').fill('wrong')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('alert').filter({ hasText: 'wrong' })).toHaveText(
    'The email or the password is wrong.',
  )
  await expect(page).toHaveURL(/\/login/)
})
