import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TestProviders } from '@/test/TestProviders'

import { ActivityEntry } from '../ActivityEntry'
import { authorCases } from './ActivityEntry.data'

describe('ActivityEntry', () => {
  it.each(authorCases)('names the entries of $author for screen readers', ({ author, name }) => {
    render(<ActivityEntry author={author}>Find a mentor.</ActivityEntry>, {
      wrapper: TestProviders,
    })

    expect(screen.getByText(`${name}:`)).toBeInTheDocument()
    expect(screen.getByText('Find a mentor.')).toBeInTheDocument()
  })
})
