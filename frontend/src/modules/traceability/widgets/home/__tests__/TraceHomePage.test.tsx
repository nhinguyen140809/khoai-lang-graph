import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectText } from '@/test/steps'

import { TraceHomePage } from '../TraceHomePage'

describe('TraceHomePage', () => {
  it('asks to open a page from the side panel, as the start page of Documents does', async () => {
    renderWithProviders(<TraceHomePage />)

    await expectText('No trace is open')
    expect(
      screen.getByText(
        'An item, a list or the open issues can be opened from the side panel of Trace.',
      ),
    ).toBeInTheDocument()
  })
})
