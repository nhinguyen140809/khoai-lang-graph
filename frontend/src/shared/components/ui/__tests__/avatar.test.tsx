import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoAccessibilityViolations } from '@/test/steps'

import { Avatar, AvatarFallback } from '../avatar'

describe('AvatarFallback', () => {
  it('keeps the muted look without a variant and a color', () => {
    render(
      <Avatar>
        <AvatarFallback>YN</AvatarFallback>
      </Avatar>,
    )

    const fallback = screen.getByText('YN')
    expect(fallback).toHaveAttribute('data-variant', 'none')
    expect(fallback).not.toHaveAttribute('data-color')
    expect(fallback).toHaveClass('bg-muted', 'text-muted-foreground')
  })

  it('reads a color alone as the soft fill of that color', () => {
    render(
      <Avatar>
        <AvatarFallback color="primary">YN</AvatarFallback>
      </Avatar>,
    )

    const fallback = screen.getByText('YN')
    expect(fallback).toHaveAttribute('data-variant', 'soft')
    expect(fallback).toHaveAttribute('data-color', 'primary')
    expect(fallback).toHaveClass('bg-(--tone-soft)', 'text-(--tone-strong)')
  })

  it('takes a solid fill with a color', () => {
    render(
      <Avatar>
        <AvatarFallback variant="solid" color="chart">
          YN
        </AvatarFallback>
      </Avatar>,
    )

    const fallback = screen.getByText('YN')
    expect(fallback).toHaveAttribute('data-variant', 'solid')
    expect(fallback).toHaveAttribute('data-color', 'chart')
    expect(fallback).toHaveClass('bg-(--tone)', 'text-(--tone-foreground)')
  })

  it('takes the muted and accent tones of the themes', () => {
    render(
      <>
        <Avatar>
          <AvatarFallback color="muted">YN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback color="accent">MS</AvatarFallback>
        </Avatar>
      </>,
    )

    expect(screen.getByText('YN')).toHaveAttribute('data-color', 'muted')
    expect(screen.getByText('YN')).toHaveAttribute('data-variant', 'soft')
    expect(screen.getByText('MS')).toHaveAttribute('data-color', 'accent')
    expect(screen.getByText('MS')).toHaveClass('bg-(--tone-soft)', 'text-(--tone-strong)')
  })

  it('has no accessibility violation', async () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback color="primary">YN</AvatarFallback>
      </Avatar>,
    )

    await expectNoAccessibilityViolations(container)
  })
})
