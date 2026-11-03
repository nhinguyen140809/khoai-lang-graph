import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { assertPresent } from '@/shared/lib/guards'

import type { ContentField } from '../../../fields/content-fields.types'
import { EntriesControl } from '../EntriesControl'
import { fieldOf } from './ContentFieldInput.data'

/** The entries of a field, as the parent of the control holds them. */
function EntriesProbe({ field, initial }: { field: ContentField; initial: unknown[] }) {
  const [entries, setEntries] = useState(initial)
  return (
    <EntriesControl
      field={field}
      entries={entries}
      onChange={setEntries}
      definition={undefined}
    />
  )
}

/** The values of the entry controls, in their order. */
function entryValues() {
  return screen.getAllByRole('textbox').map((entry) => (entry as HTMLInputElement).value)
}

describe('EntriesControl', () => {
  it('appends an empty entry on Add and focuses its control', async () => {
    const user = userEvent.setup()
    render(<EntriesProbe field={fieldOf('criteria')} initial={[]} />)

    await user.click(screen.getByRole('button', { name: 'Add' }))

    const entry = assertPresent(screen.queryByRole('textbox'), 'No entry was added')
    expect(entry).toHaveFocus()
    expect(entry).toHaveValue('')
  })

  it('focuses the entry that takes the place of a removed one', async () => {
    const user = userEvent.setup()
    render(<EntriesProbe field={fieldOf('criteria')} initial={['Given', 'When', 'Then']} />)

    await user.click(screen.getByRole('button', { name: 'Remove entry 2 of Criteria' }))

    expect(entryValues()).toEqual(['Given', 'Then'])
    expect(screen.getAllByRole('textbox')[1]).toHaveFocus()
  })

  it('focuses the entry before one that is removed last', async () => {
    const user = userEvent.setup()
    render(<EntriesProbe field={fieldOf('criteria')} initial={['Given', 'When']} />)

    await user.click(screen.getByRole('button', { name: 'Remove entry 2 of Criteria' }))

    expect(entryValues()).toEqual(['Given'])
    expect(screen.getAllByRole('textbox')[0]).toHaveFocus()
  })

  it('focuses Add when the only entry is removed', async () => {
    const user = userEvent.setup()
    render(<EntriesProbe field={fieldOf('criteria')} initial={['Given']} />)

    await user.click(screen.getByRole('button', { name: 'Remove entry 1 of Criteria' }))

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toHaveFocus()
  })

  it('shows the fields of an entry of an object list, each with its label', () => {
    render(<EntriesProbe field={fieldOf('roles')} initial={[{ who: 'Ann' }]} />)

    expect(screen.getByRole('textbox', { name: 'Who' })).toHaveValue('Ann')
    expect(screen.getByRole('textbox', { name: 'What' })).toBeInTheDocument()
  })
})
