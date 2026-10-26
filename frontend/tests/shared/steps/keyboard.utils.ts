import type { Page } from '@playwright/test'

/** Types text with the keyboard, in the element that has the focus. */
export async function typeText(page: Page, text: string) {
  await page.keyboard.type(text)
}

/** Presses one key on the element that has the focus, by its name, such as `Enter` or `Tab`. */
export async function pressKey(page: Page, key: string) {
  await page.keyboard.press(key)
}
