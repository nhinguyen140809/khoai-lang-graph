import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectText, press } from '@/test/steps'

import { IconsCard } from '../components/cards/IconsCard'

describe('IconsCard', () => {
  it('names every icon that is drawn by a clock and every icon of our own', async () => {
    renderWithProviders(<IconsCard />)

    for (const name of ['search', 'typed-line', 'ungroup', 'dot', 'exclamation', 'spinning']) {
      await expectText(name)
    }
  })

  it('pauses and plays the clock from its toggle', async () => {
    renderWithProviders(<IconsCard />)

    await press(await screen.findByRole('button', { name: 'Playing' }))

    expect(screen.getByRole('button', { name: 'Paused' })).toHaveAttribute('aria-pressed', 'false')
  })
})
