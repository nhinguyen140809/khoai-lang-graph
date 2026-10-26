import userEvent from '@testing-library/user-event'

/** Types text in a field, one key at a time; the text may hold keys, such as `{Enter}`. */
export async function typeText(field: HTMLElement, text: string) {
  await userEvent.type(field, text)
}

/** Pastes text into the field that has the focus, as one change. */
export async function pasteText(text: string) {
  await userEvent.paste(text)
}

/** Presses one key on the element that has the focus, by its name, such as `Enter` or `ArrowUp`. */
export async function pressKey(key: string) {
  await userEvent.keyboard(`{${key}}`)
}

/** Presses keys in the syntax of user-event, such as `{Shift>}{ArrowUp}{/Shift}` for Shift and Up. */
export async function pressKeys(keys: string) {
  await userEvent.keyboard(keys)
}

/** Clicks an element while a key is held down, such as `Shift`; the key is released afterwards. */
export async function clickHolding(key: string, element: HTMLElement) {
  const user = userEvent.setup()
  await user.keyboard(`{${key}>}`)
  await user.click(element)
  await user.keyboard(`{/${key}}`)
}

/** Presses Tab, which moves the focus to the next control. */
export async function pressTab() {
  await userEvent.tab()
}

/** Presses Escape, which closes the dialog or the menu that has the focus. */
export async function pressEscape() {
  await pressKey('Escape')
}
