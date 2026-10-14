import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

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

      await userEvent.click(title)

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

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    expect(refresh).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Outline' })).toHaveAttribute('aria-expanded', 'true')
  })
})
