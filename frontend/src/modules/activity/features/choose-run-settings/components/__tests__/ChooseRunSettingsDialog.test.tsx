import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations, pressButton, typeText } from '@/test/steps'

import { useChosenRunSettingsStore } from '../../stores/chosen-run-settings.store'
import { useRunSettingsDialogStore } from '../../stores/run-settings-dialog.store'
import { ChooseRunSettingsDialog } from '../ChooseRunSettingsDialog'

/** Mounts the dialog and opens it for a thread. */
async function openDialog(threadId = 't1') {
  useRunSettingsDialogStore.getState().closed()
  renderWithProviders(<ChooseRunSettingsDialog />)
  useRunSettingsDialogStore.getState().openDialog(threadId)

  const dialog = await screen.findByRole('dialog')
  expect(dialog).toHaveAttribute('data-size', 'xl')
  expect(dialog).toHaveAttribute('data-scroll-body', 'true')
  return dialog
}

describe('ChooseRunSettingsDialog', () => {
  it('keeps the settings for the thread on Apply, and closes', async () => {
    await openDialog()

    const maxSteps = screen.getByRole('spinbutton', { name: 'Maximum steps' })
    await typeText(maxSteps, '40')
    await pressButton('Apply')

    expect(useChosenRunSettingsStore.getState().settingsByThread.t1?.max_steps).toBe(40)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('empties every field on Reset, and keeps the dialog open', async () => {
    await openDialog()

    const maxSteps = screen.getByRole('spinbutton', { name: 'Maximum steps' })
    await typeText(maxSteps, '40')
    await pressButton('Reset')

    expect(
      within(screen.getByRole('dialog')).getByRole('spinbutton', { name: 'Maximum steps' }),
    ).toHaveValue('')
    // The dialog stays open; the test closes it so that the next one starts clean.
    await pressButton('Cancel')
    await screen.findByRole('dialog').catch(() => undefined)
  })

  it('keeps the settings as they were on Cancel', async () => {
    await openDialog()

    const maxSteps = screen.getByRole('spinbutton', { name: 'Maximum steps' })
    await typeText(maxSteps, '40')
    await pressButton('Cancel')

    expect(useChosenRunSettingsStore.getState().settingsByThread.t1).toBeUndefined()
  })

  it('has no accessibility violation', async () => {
    await openDialog()

    await expectNoAccessibilityViolations()
  })
})
