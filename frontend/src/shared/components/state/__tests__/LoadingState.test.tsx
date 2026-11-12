import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectAttribute } from '@/test/steps'

import { LoadingState } from '../LoadingState'
import { loadingCases } from './LoadingState.data'

describe('LoadingState', () => {
  it.each(loadingCases)('shows $name', ({ size, rows, columns, layout, skeletons }) => {
    const { container } = render(
      <LoadingState
        label="Loading things"
        size={size}
        rows={rows}
        columns={columns}
        layout={layout}
      />,
    )

    expectAttribute('status', 'Loading things', 'aria-busy', 'true')
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(skeletons)
  })

  it('takes the gap and the height of an item from the caller', () => {
    const { container } = render(
      <LoadingState
        label="Loading things"
        layout="cards"
        rows={2}
        gap={10}
        itemHeight={40}
        fill={false}
      />,
    )

    const list = screen.getByRole('status').firstElementChild?.firstElementChild
    expect(list).toHaveStyle({ gap: 'calc(var(--spacing) * 10)' })
    expect(container.querySelector('.rounded-lg.border')).toHaveStyle({
      minHeight: 'calc(var(--spacing) * 40)',
    })
  })

  it('fills the width of its container, apart from the narrow column of the lines', () => {
    render(<LoadingState label="Loading things" layout="document" />)

    expect(screen.getByRole('status')).toHaveClass('w-full')
    expect(screen.getByRole('status')).not.toHaveClass('items-center')
  })

  it('keeps a narrow column in the middle when it is asked to', () => {
    const { container } = render(
      <LoadingState label="Loading things" layout="list" width="narrow" />,
    )

    expect(container.querySelector('.max-w-md')).not.toBeNull()
  })

  it('takes the whole width for the lines of no layout when it is asked to', () => {
    const { container } = render(<LoadingState label="Loading things" width="full" />)

    expect(container.querySelector('.max-w-md')).toBeNull()
    expect(screen.getByRole('status')).toHaveClass('w-full')
  })

  it('keeps the narrow column in the middle of the lines of no layout by default', () => {
    const { container } = render(<LoadingState label="Loading things" />)

    expect(container.querySelector('.max-w-md')).not.toBeNull()
  })
})
