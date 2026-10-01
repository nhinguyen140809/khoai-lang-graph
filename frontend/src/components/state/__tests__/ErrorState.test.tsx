import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ErrorState } from '../ErrorState'

describe('ErrorState', () => {
  it.each(['compact', 'page'] as const)('shows the message and retries (%s)', async (size) => {
    const onRetry = vi.fn()
    render(<ErrorState message="Failed to load threads" onRetry={onRetry} size={size} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load threads')

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('has no retry button without onRetry', () => {
    render(<ErrorState message="Failed" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
