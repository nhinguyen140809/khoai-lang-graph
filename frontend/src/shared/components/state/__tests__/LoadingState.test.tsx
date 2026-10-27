import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectAttribute } from '@/test/steps'

import { LoadingState } from '../LoadingState'
import { loadingCases } from './LoadingState.data'

describe('LoadingState', () => {
  it.each(loadingCases)('shows $name', ({ size, rows, columns, skeletons }) => {
    const { container } = render(
      <LoadingState label="Loading things" size={size} rows={rows} columns={columns} />,
    )

    expectAttribute('status', 'Loading things', 'aria-busy', 'true')
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(skeletons)
  })
})
