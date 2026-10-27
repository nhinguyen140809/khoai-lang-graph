import { test } from '../../shared/fixtures.utils'
import { refusedFormCases, sentFormCases, switchCases } from './account.data'

for (const { name, address, fields, submit, opens } of sentFormCases) {
  test(name, async ({ page, user }) => {
    await page.goto(address)

    await user.submitForm(fields, submit)

    await user.expectUrl(opens)
  })
}

for (const { name, address, fields, submit, message, stays } of refusedFormCases) {
  test(name, async ({ page, user }) => {
    await page.goto(address)

    await user.submitForm(fields, submit)

    await user.expectAlert(message)
    await user.expectUrl(stays)
  })
}

for (const { name, address, link, opens } of switchCases) {
  test(name, async ({ page, user }) => {
    await page.goto(address)

    await user.pressLink(link)

    await user.expectUrl(opens)
  })
}
