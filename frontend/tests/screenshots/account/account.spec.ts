import { linhFields } from '../../shared/accounts.constants'
import type { UserSteps } from '../../shared/steps'
import { screenshots } from '../screenshot.utils'

async function logIn(user: UserSteps) {
  await user.submitForm(linhFields, 'Log in')
}

async function register(user: UserSteps) {
  await user.submitForm({ Name: 'An Tran', ...linhFields }, 'Register')
}

// The account menu is the button of the user on the activity bar, named "Account" until the user loads.
async function openAccountMenu(user: UserSteps, button: string) {
  await user.pressButton(button)
  await user.expectRole('menu')
}

async function askToLogout(user: UserSteps) {
  await openAccountMenu(user, 'Linh Pham')
  await user.pressMenuItem('Log out')
  await user.expectRole('alertdialog')
}

screenshots('Account', (shot) => {
  shot.at('Sign-in page', '/login')

  shot('Sign-in page with the errors of its fields', async ({ page, user, shoot }) => {
    await page.goto('/login')

    await user.pressButton('Log in')
    await user.expectFieldErrors()
    await shoot()
  })

  shot('Wrong email or password', async ({ page, user, shoot }) => {
    await page.goto('/login?mock-login=error')

    await logIn(user)
    await shoot()
  })

  shot('Logging in', async ({ page, user, shoot }) => {
    await page.goto('/login?mock-login=loading')

    await logIn(user)
    await user.expectLabel('Logging in')
    await shoot()
  })

  shot.at('Create an account', '/register')

  shot('Create an account with the errors of its fields', async ({ page, user, shoot }) => {
    await page.goto('/register')

    await user.pressButton('Register')
    await user.expectFieldErrors()
    await shoot()
  })

  shot('The email has an account', async ({ page, user, shoot }) => {
    await page.goto('/register?mock-register=error')

    await register(user)
    await shoot()
  })

  shot('Registering', async ({ page, user, shoot }) => {
    await page.goto('/register?mock-register=loading')

    await register(user)
    await user.expectLabel('Creating the account')
    await shoot()
  })

  shot('The account is created, but logging in fails', async ({ page, user, shoot }) => {
    await page.goto('/register?mock-login=error')

    await register(user)
    await user.expectUrl(/\/login/)
    await user.expectText('The account is created. Log in with it.')
    await shoot()
  })

  shot('Account menu', async ({ page, user, shoot }) => {
    await page.goto('/projects')

    await openAccountMenu(user, 'Linh Pham')
    await shoot()
  })

  shot('Account menu loading', async ({ page, user, shoot }) => {
    await page.goto('/projects?mock-me=loading')

    await openAccountMenu(user, 'Account')
    await shoot()
  })

  shot('Account menu error', async ({ page, user, shoot }) => {
    await page.goto('/projects?mock-me=error')

    await openAccountMenu(user, 'Account')
    await user.expectRole('menuitem', /Failed to load your account/)
    await shoot()
  })

  shot('Log out?', async ({ page, user, shoot }) => {
    await page.goto('/projects')

    await askToLogout(user)
    await shoot()
  })

  shot('Logged out, back at the login page', async ({ page, user, shoot }) => {
    await page.goto('/projects')

    await askToLogout(user)
    await user.pressAlertDialogButton('Log out')
    await user.expectUrl(/\/login/)
    await shoot()
  })
})
