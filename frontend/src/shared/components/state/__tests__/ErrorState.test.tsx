import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoRole, pressButton } from '@/test/steps'

import { ErrorState } from '../ErrorState'
import { stateSizes } from './ErrorState.data'

describe('ErrorState', () => {
  it.each(stateSizes)('shows the message and retries (%s)', async (size) => {
    const onRetry = vi.fn()
    render(<ErrorState message="Failed to load threads" onRetry={onRetry} size={size} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load threads')

    await pressButton('Try again')

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('has no retry button without onRetry', () => {
    render(<ErrorState message="Failed" />)

    expectNoRole('button')
  })
})
