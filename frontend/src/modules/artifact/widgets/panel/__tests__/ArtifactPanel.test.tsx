import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ArtifactPanel } from '../ArtifactPanel'
import { panelTabCases } from './ArtifactPanel.data'

describe('ArtifactPanel', () => {
  it('opens on the file tab', () => {
    render(<ArtifactPanel />)

    expect(screen.getByRole('tab', { name: 'File' })).toHaveAttribute('aria-selected', 'true')
  })

  it.each(panelTabCases)('shows the $tab tab', async ({ tab, text }) => {
    render(<ArtifactPanel />)

    await userEvent.click(screen.getByRole('tab', { name: tab }))

    expect(screen.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent(text)
  })
})
