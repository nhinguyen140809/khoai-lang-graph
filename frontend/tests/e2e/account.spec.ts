import { expect, test } from '@playwright/test'

test('signs in and returns to the page asked for', async ({ page }) => {
  await page.goto('/login?next=%2Fsettings')

  await page.getByLabel('Email').fill('linh.pham@example.com')
  await page.getByLabel('Password').fill('secret')
  await page.getByRole('button', { name: 'Sign in' }).click()

  // The dev server renders the page on the first visit, which can be slow.
  await expect(page).toHaveURL(/\/settings$/, { timeout: 20_000 })
})

test('creates an account, signs in with it, and returns to the page asked for', async ({
  page,
}) => {
  await page.goto('/login?next=%2Fsettings')
  await page.getByRole('link', { name: 'Create an account' }).click()
  await expect(page).toHaveURL(/\/register\?next=%2Fsettings$/)

  await page.getByLabel('Name').fill('An Tran')
  await page.getByLabel('Email').fill('an@example.com')
  await page.getByLabel('Password').fill('secret')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL(/\/settings$/, { timeout: 20_000 })
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
