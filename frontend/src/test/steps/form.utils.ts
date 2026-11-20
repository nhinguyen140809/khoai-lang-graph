import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { typeText } from './keyboard.utils'

type Role = Parameters<typeof screen.findByRole>[0]

/** Presses the control that the test has found itself, such as one inside a dialog or a row. */
export async function press(control: Element) {
  await userEvent.click(control)
}

/** Presses the control of this role and name, once it has appeared. */
export async function pressRole(role: Role, name: string | RegExp) {
  const control = await screen.findByRole(role, { name })
  await userEvent.click(control)
}

/** Presses the button with this name, once it has appeared. */
export function pressButton(name: string | RegExp) {
  return pressRole('button', name)
}

/** Presses the item of the open menu with this name, once it has appeared. */
export function pressMenuItem(name: string | RegExp) {
  return pressRole('menuitem', name)
}

/** Presses the control twice, as the double click that opens a tab or a file. */
export async function pressTwice(control: Element) {
  await userEvent.dblClick(control)
}

/** Holds the pointer over the control, as its tooltip or its menu needs. */
export async function hoverOver(control: Element) {
  await userEvent.hover(control)
}

/** Moves the pointer off the control again. */
export async function hoverAway(control: Element) {
  await userEvent.unhover(control)
}

/** Chooses this option of the select; `''` chooses its empty option. */
export async function chooseOption(select: Element, value: string) {
  await userEvent.selectOptions(select, value)
}

/** Replaces the text of a field with this one; the text may hold keys, such as `{Enter}`. */
export async function replaceText(field: HTMLElement, text: string) {
  await userEvent.clear(field)
  // An empty text only clears the field: user-event types no key at all.
  if (text !== '') await typeText(field, text)
}

/** Types a value in each field of the form, the fields found by their labels. */
export async function fillFields(values: Readonly<Record<string, string>>) {
  for (const [label, value] of Object.entries(values)) {
    await typeText(screen.getByLabelText(label), value)
  }
}
