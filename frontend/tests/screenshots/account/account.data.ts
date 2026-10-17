import { expect, type Page } from '@playwright/test'

import { type Shot, visit } from '../screenshot.utils'

async function signIn(page: Page) {
  await page.getByLabel('Email').fill('linh.pham@example.com')
  await page.getByLabel('Password').fill('secret')
  await page.getByRole('button', { name: 'Sign in' }).click()
}

async function register(page: Page) {
  await page.getByLabel('Name').fill('An Tran')
  await page.getByLabel('Email').fill('linh.pham@example.com')
  await page.getByLabel('Password').fill('secret')
  await page.getByRole('button', { name: 'Create account' }).click()
}

async function showFieldErrors(page: Page, submit: string) {
  await page.getByRole('button', { name: submit }).click()
  await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible()
}

/** The states of the sign-in and registration pages, and the steps to each. */
export const accountShots: Shot[] = [
  { name: 'Sign-in page', steps: visit('/login') },
  {
    name: 'Sign-in page with the errors of its fields',
    steps: async (page) => {
      await page.goto('/login')
      await showFieldErrors(page, 'Sign in')
    },
  },
  {
    name: 'Wrong email or password',
    steps: async (page) => {
      await page.goto('/login?mock-login=error')
      await signIn(page)
    },
  },
  {
    name: 'Signing in',
    steps: async (page) => {
      await page.goto('/login?mock-login=loading')
      await signIn(page)
    },
    ready: (page) => page.getByLabel('Signing in'),
  },
  { name: 'Create an account', steps: visit('/register') },
  {
    name: 'Create an account with the errors of its fields',
    steps: async (page) => {
      await page.goto('/register')
      await showFieldErrors(page, 'Create account')
    },
  },
  {
    name: 'The email has an account',
    steps: async (page) => {
      await page.goto('/register?mock-register=error')
      await register(page)
    },
  },
  {
    name: 'Creating an account',
    steps: async (page) => {
      await page.goto('/register?mock-register=loading')
      await register(page)
    },
    ready: (page) => page.getByLabel('Creating the account'),
  },
  {
    name: 'The account is created, but signing in fails',
    steps: async (page) => {
      await page.goto('/register?mock-login=error')
      await register(page)
      await expect(page).toHaveURL(/\/login/)
    },
    ready: (page) => page.getByText('The account is created. Sign in with it.'),
  },
]
