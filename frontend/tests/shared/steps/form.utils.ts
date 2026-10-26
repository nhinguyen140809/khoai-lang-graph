import type { Locator, Page } from '@playwright/test'

/** The fields of a form, by their labels, with what the user types in them. */
export type Fields = Record<string, string>

/** Types a value in each field of the form. */
export async function fillFields(page: Page, fields: Fields) {
  for (const [label, value] of Object.entries(fields)) {
    await page.getByLabel(label, { exact: true }).fill(value)
  }
}

/** Presses the button with this name, in the scope when it is given, such as the main area. */
export async function pressButton(page: Page, name: string, scope: Page | Locator = page) {
  await scope.getByRole('button', { name }).click()
}

/** Presses the link with this name. */
export async function pressLink(page: Page, name: string, scope: Page | Locator = page) {
  await scope.getByRole('link', { name }).click()
}

/** Presses the item of the open menu with this name. */
export async function pressMenuItem(page: Page, name: string) {
  await page.getByRole('menuitem', { name }).click()
}

/** Types a value in the text field with this name, in the scope when it is given, such as a dialog. */
export async function fillTextbox(
  page: Page,
  name: string,
  value: string,
  scope: Page | Locator = page,
) {
  await scope.getByRole('textbox', { name }).fill(value)
}

/** Fills the form in and presses the button that sends it. */
export async function submitForm(page: Page, fields: Fields, submit: string) {
  await fillFields(page, fields)
  await pressButton(page, submit)
}
