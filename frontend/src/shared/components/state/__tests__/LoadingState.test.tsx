import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LoadingState } from '../LoadingState'
import { loadingCases } from './LoadingState.data'

describe('LoadingState', () => {
  it.each(loadingCases)('shows $name', ({ size, rows, skeletons }) => {
    const { container } = render(<LoadingState label="Loading things" size={size} rows={rows} />)

    expect(screen.getByRole('status', { name: 'Loading things' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(skeletons)
  })
})
