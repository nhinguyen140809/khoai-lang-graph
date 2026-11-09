import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoAccessibilityViolations } from '@/test/steps'

import { InitialsAvatar } from '../initials-avatar'

describe('InitialsAvatar', () => {
  it('draws the initials of the name on the soft fill of its tone', () => {
    render(<InitialsAvatar name="Ann Smith" tone="chart" />)

    const fallback = screen.getByText('AS')
    expect(fallback).toHaveAttribute('data-variant', 'soft')
    expect(fallback).toHaveAttribute('data-color', 'chart')
  })

  it('takes a size', () => {
    render(<InitialsAvatar name="Ann" tone="primary" size="lg" />)

    expect(screen.getByText('A').closest('[data-slot="avatar"]')).toHaveAttribute('data-size', 'lg')
  })

  it('is hidden from assistive technology, since the name sits beside it', () => {
    render(<InitialsAvatar name="Ann" tone="primary" />)

    expect(screen.getByText('A').closest('[data-slot="avatar"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('has no accessibility violation', async () => {
    const { container } = render(<InitialsAvatar name="Ann Smith" tone="primary" />)

    await expectNoAccessibilityViolations(container)
  })
})
