import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { expectAttribute, press, pressButton } from '@/test/steps'

import { SidePanelSection } from '../SidePanelSection'
import { openingCases } from './SidePanelSection.data'

describe('SidePanelSection', () => {
  it.each(openingCases)(
    'starts $name, and its title opens or collapses it',
    async ({ props, open }) => {
      render(
        <SidePanelSection title="Outline" {...props}>
          <p>Content</p>
        </SidePanelSection>,
      )
      const title = screen.getByRole('button', { name: 'Outline' })

      expect(title).toHaveAttribute('aria-expanded', String(open))
      expect(screen.queryByText('Content') !== null).toBe(open)

      await press(title)

      expect(title).toHaveAttribute('aria-expanded', String(!open))
      expect(screen.queryByText('Content') !== null).toBe(!open)
    },
  )

  it('shows actions next to its title, which leave the section open', async () => {
    const refresh = vi.fn()
    render(
      <SidePanelSection
        title="Outline"
        actions={
          <button type="button" onClick={refresh}>
            Refresh
          </button>
        }
      >
        <p>Content</p>
      </SidePanelSection>,
    )

    await pressButton('Refresh')

    expect(refresh).toHaveBeenCalledOnce()
    expectAttribute('button', 'Outline', 'aria-expanded', 'true')
  })
})
