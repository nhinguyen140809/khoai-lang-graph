import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoRole, pressButton } from '@/test/steps'

import { AttachedSources } from '../components/AttachedSources'

describe('AttachedSources', () => {
  it('shows nothing without files', () => {
    render(<AttachedSources files={[]} onRemove={vi.fn()} />)

    expectNoRole('list')
  })

  it('lists the files, each with a button that takes it off', async () => {
    const onRemove = vi.fn()
    const notes = new File(['x'], 'notes.md')
    render(<AttachedSources files={[notes, new File(['y'], 'brief.txt')]} onRemove={onRemove} />)

    expect(screen.getByRole('list', { name: 'Sources to upload' })).toHaveTextContent('notes.md')
    await pressButton('Remove notes.md')

    expect(onRemove).toHaveBeenCalledWith(notes)
  })
})
