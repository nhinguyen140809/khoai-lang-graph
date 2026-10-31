import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { KeyText } from '../key-text'

describe('KeyText', () => {
  it('renders the key as small muted words in the mono font', () => {
    render(<KeyText>REQ-001</KeyText>)

    expect(screen.getByText('REQ-001')).toHaveClass('font-mono', 'text-xs', 'text-muted-foreground')
  })

  it('cuts a long key, and titles the whole key for whoever hovers', () => {
    const key = '5f2d0000-0000-4000-8000-000000000001'
    render(<KeyText truncate>{key}</KeyText>)

    expect(screen.getByText(key)).toHaveClass('truncate')
    expect(screen.getByText(key)).toHaveAttribute('title', key)
  })

  it('keeps the title it is given over the key', () => {
    render(
      <KeyText truncate title="The run of the API examples">
        5f2d0000
      </KeyText>,
    )

    expect(screen.getByText('5f2d0000')).toHaveAttribute('title', 'The run of the API examples')
  })

  it('passes its props to the words', () => {
    const onClick = vi.fn()
    render(
      <KeyText onClick={onClick} className="text-3xs">
        REQ-001
      </KeyText>,
    )

    expect(screen.getByText('REQ-001')).toHaveClass('text-3xs')
    screen.getByText('REQ-001').click()
    expect(onClick).toHaveBeenCalledOnce()
  })
})
