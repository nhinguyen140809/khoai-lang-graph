import { waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'

import { cancelAction, confirmAction, expectNoConfirmDialog, pressEscape } from '../../steps'
import type { AsksBeforeActionCase } from './confirm-action.types'

/**
 * Tests that an action asks before it runs: nothing runs while the dialog is open, nothing runs
 * after Cancel or Escape, the action runs once and the dialog goes after Confirm, the focus goes
 * back to the control that opened it (when `opener` is given), and a failure leaves the dialog open
 * so that the user can try again or cancel.
 */
export function itAsksBeforeAction({
  action,
  open,
  confirmLabel,
  cancelLabel,
  hasRun,
  opener,
  fail,
}: AsksBeforeActionCase) {
  it(`runs nothing while the dialog of ${action} is open`, async () => {
    await open()

    expect(hasRun()).toBe(false)
  })

  it(`does not run ${action} after Cancel`, async () => {
    const dialog = await open()

    await cancelAction(dialog, cancelLabel)

    await expectNoConfirmDialog()
    expect(hasRun()).toBe(false)
  })

  it(`does not run ${action} after Escape`, async () => {
    await open()

    await pressEscape()

    await expectNoConfirmDialog()
    expect(hasRun()).toBe(false)
  })

  it(`runs ${action} once the dialog is confirmed, and closes it`, async () => {
    const dialog = await open()

    await confirmAction(dialog, confirmLabel)

    await expectNoConfirmDialog()
    expect(hasRun()).toBe(true)
  })

  if (opener !== undefined) {
    it(`gives the focus back to the control that opened the dialog of ${action}`, async () => {
      const dialog = await open()

      await cancelAction(dialog, cancelLabel)

      await expectNoConfirmDialog()
      expect(opener()).toHaveFocus()
    })
  }

  if (fail === undefined) return

  it(`keeps the dialog of ${action} open when the action fails`, async () => {
    const dialog = await open()
    fail()

    await confirmAction(dialog, confirmLabel)
    await waitFor(() => {
      expect(hasRun()).toBe(true)
    })

    // The dialog is still there and answers again: Cancel works once the failure has settled.
    await cancelAction(dialog, cancelLabel)
    await expectNoConfirmDialog()
  })
}
