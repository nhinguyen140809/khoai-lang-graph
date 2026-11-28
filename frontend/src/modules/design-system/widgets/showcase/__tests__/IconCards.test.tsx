import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectText, press } from '@/test/steps'

import { AssetsCard } from '../components/cards/identity/AssetsCard'
import { BoardsCard } from '../components/cards/identity/BoardsCard'
import { DrawnIconsCard } from '../components/cards/identity/DrawnIconsCard'
import { OwnIconsCard } from '../components/cards/identity/OwnIconsCard'

describe('DrawnIconsCard', () => {
  it('names the icons that are drawn by a clock', async () => {
    renderWithProviders(<DrawnIconsCard />)

    for (const name of ['bars', 'typed-line', 'ungroup', 'drawn-dot']) {
      await expectText(name)
    }
  })

  it('pauses and plays the clock from its toggle', async () => {
    renderWithProviders(<DrawnIconsCard />)

    await press(await screen.findByRole('button', { name: 'Playing' }))

    expect(screen.getByRole('button', { name: 'Paused' })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('AssetsCard', () => {
  it('names the assets it draws as such, in every one of their sizes', async () => {
    renderWithProviders(<AssetsCard />)

    for (const name of ['laptop lg', 'globe lg', 'document lg', 'gantt-board lg']) {
      await expectText(name)
    }
  })
})

describe('BoardsCard', () => {
  it('draws every shape of the board and carries an icon on one', async () => {
    renderWithProviders(<BoardsCard />)

    for (const name of ['board sheet', 'board panel', 'board with its own marks', 'board bars']) {
      await expectText(name)
    }
  })
})

describe('OwnIconsCard', () => {
  it('names every icon of our own', async () => {
    renderWithProviders(<OwnIconsCard />)

    for (const name of ['dot', 'exclamation', 'pause-solid', 'zap-solid', 'spinning']) {
      await expectText(name)
    }
  })
})
