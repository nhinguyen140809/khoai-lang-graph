import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'

// The steps of a test of an action that asks first, such as Delete or Log out: the dialog opens,
// the user confirms or cancels, and the dialog goes.

/** The dialog that asks about an action, once it has opened. */
export function findConfirmDialog(name: string) {
  return screen.findByRole('alertdialog', { name })
}

/** Presses the button of the dialog that runs the action, named as the action. */
export async function confirmAction(dialog: HTMLElement, label: string) {
  await userEvent.click(within(dialog).getByRole('button', { name: label }))
}

/** Presses the button of the dialog that leaves the action undone. */
export async function cancelAction(dialog: HTMLElement, label = 'Cancel') {
  await userEvent.click(within(dialog).getByRole('button', { name: label }))
}

/** Waits until no dialog asks about an action. */
export async function expectNoConfirmDialog() {
  await waitFor(() => {
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
}
