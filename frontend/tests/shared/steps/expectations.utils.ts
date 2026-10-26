import { expect, type Locator, type Page } from '@playwright/test'

type Text = string | RegExp
type Role = Parameters<Page['getByRole']>[0]
/** Where a control is looked for: the page, or a part of it, such as a row or a dialog. */
type Scope = Page | Locator

// What a test checks on the page. Each check waits until it holds, up to the timeout of `expect`
// in the Playwright config.

/** Waits until the page is at an address that matches. */
export async function expectUrl(page: Page, address: Text) {
  await expect(page).toHaveURL(address)
}

/** Waits until a control of this role, and of this name when it is given, shows in the scope. */
export async function expectRole(page: Page, role: Role, name?: Text, scope: Scope = page) {
  await expect(scope.getByRole(role, name === undefined ? {} : { name })).toBeVisible()
}

/** Waits until no control of this role and name shows. */
export async function expectNoRole(page: Page, role: Role, name: Text, scope: Scope = page) {
  await expect(scope.getByRole(role, { name })).toHaveCount(0)
}

/** Waits until an element with this label shows, such as a spinner that is labelled. */
export async function expectLabel(page: Page, label: Text) {
  await expect(page.getByLabel(label)).toBeVisible()
}

/** Waits until this text shows. */
export async function expectText(page: Page, text: Text) {
  await expect(page.getByText(text)).toBeVisible()
}

/** Waits until an alert shows this message. */
export async function expectAlert(page: Page, message: string) {
  await expect(page.getByRole('alert').filter({ hasText: message })).toHaveText(message)
}

/** Waits until a field of the form shows its error. */
export async function expectFieldErrors(page: Page) {
  await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible()
}

/** Waits until a field has this value. */
export async function expectFieldValue(
  page: Page,
  label: string,
  value: string,
  scope: Scope = page,
) {
  await expect(scope.getByRole('textbox', { name: label })).toHaveValue(value)
}
