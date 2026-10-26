import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { typeText } from './keyboard.utils'

type Role = Parameters<typeof screen.findByRole>[0]

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

/** Replaces the text of a field with this one; the text may hold keys, such as `{Enter}`. */
export async function replaceText(field: HTMLElement, text: string) {
  await userEvent.clear(field)
  await typeText(field, text)
}

/** Types a value in each field of the form, the fields found by their labels. */
export async function fillFields(values: Readonly<Record<string, string>>) {
  for (const [label, value] of Object.entries(values)) {
    await typeText(screen.getByLabelText(label), value)
  }
}
