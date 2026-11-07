import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useRunSettingsDialogStore } from '@/modules/activity/features/choose-run-settings'
import { renderWithProviders } from '@/test/render'

import { ActivityDialogs } from '../ActivityDialogs'

describe('ActivityDialogs', () => {
  it('opens the run settings dialog from its store', async () => {
    renderWithProviders(<ActivityDialogs />)

    useRunSettingsDialogStore.getState().openDialog('t1')

    expect(await screen.findByRole('dialog')).toHaveAttribute('data-size', 'xl')
  })
})
