import { seededAccount } from '../../shared/backend-env.constants'
import { test } from '../../shared/fixtures.utils'
import { guardedPages, refusedSignIns } from './account-backend.data'

// These specs start without the cookies that the other specs share.
test.use({ storageState: { cookies: [], origins: [] } })

for (const { name, address, opens } of guardedPages) {
  test(`sends a visit to ${name} without an account to the login`, async ({ page, user }) => {
    await page.goto(address)

    await user.expectUrl(opens)
  })
}

test('signs in with the seeded account and returns to the page asked for', async ({
  page,
  user,
}) => {
  await page.goto('/login?next=%2Fsettings')

  await user.submitForm({ Email: seededAccount.email, Password: seededAccount.password }, 'Log in')

  await user.expectUrl(/\/settings$/)
})

for (const { name, fields, message } of refusedSignIns) {
  test(`refuses ${name}`, async ({ page, user }) => {
    await page.goto('/login')

    await user.submitForm(fields, 'Log in')

    await user.expectAlert(message)
    await user.expectUrl(/\/login/)
  })
}
