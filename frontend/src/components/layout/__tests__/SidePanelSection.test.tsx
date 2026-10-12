import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { SidePanelSection } from '../SidePanelSection'

describe('SidePanelSection', () => {
  it('shows its content and collapses to its title', async () => {
    render(
      <SidePanelSection title="Outline">
        <p>Content</p>
      </SidePanelSection>,
    )
    const title = screen.getByRole('button', { name: 'Outline' })

    expect(title).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Content')).toBeVisible()

    await userEvent.click(title)

    expect(title).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('starts collapsed when asked to', () => {
    render(
      <SidePanelSection title="Outline" defaultOpen={false}>
        <p>Content</p>
      </SidePanelSection>,
    )

    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })
})
