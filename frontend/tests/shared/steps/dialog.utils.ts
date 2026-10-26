import type { Page } from '@playwright/test'

/** Presses the button with this name in the dialog that is open. */
export async function pressDialogButton(page: Page, name: string) {
  await page.getByRole('dialog').getByRole('button', { name }).click()
}

/** Presses the button with this name in the dialog that asks before an action. */
export async function pressAlertDialogButton(page: Page, name: string) {
  await page.getByRole('alertdialog').getByRole('button', { name }).click()
}
