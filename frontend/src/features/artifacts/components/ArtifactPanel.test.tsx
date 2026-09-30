import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ArtifactPanel } from './ArtifactPanel'

describe('ArtifactPanel', () => {
  it('switches between the file, graph, and trace tabs', async () => {
    const user = userEvent.setup()
    render(<ArtifactPanel />)

    expect(screen.getByText(/artifacts produced by agents/i)).toBeVisible()

    await user.click(screen.getByRole('tab', { name: /graph/i }))

    expect(screen.getByText(/live agent graph/i)).toBeVisible()
  })
})
