import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NotFoundState } from '../NotFoundState'

describe('NotFoundState', () => {
  it('says the page was not found by default', () => {
    render(<NotFoundState />)

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('shows the reference, its own title, and the action', () => {
    render(
      <NotFoundState
        title="Thread not found"
        reference="thread-42"
        action={<button type="button">Open the threads</button>}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Thread not found' })).toBeInTheDocument()
    expect(screen.getByText('thread-42')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open the threads' })).toBeInTheDocument()
  })

  it('shows only the title and the action in the compact size', () => {
    render(<NotFoundState size="compact" reference="thread-42" />)

    expect(screen.getByText('Page not found')).toBeInTheDocument()
    expect(screen.queryByText('thread-42')).not.toBeInTheDocument()
  })
})
