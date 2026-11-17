import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { FilterField } from '../filter.types'
import { FilterDropdown } from '../FilterDropdown'

const fields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    choose: 'many',
    options: [
      { value: 'failed', label: 'Failed' },
      { value: 'done', label: 'Done' },
    ],
  },
  {
    key: 'period',
    label: 'Period',
    choose: 'one',
    options: [{ value: '7', label: 'In the last 7 days' }],
  },
]

function renderMenu(values = {}) {
  const onToggle = vi.fn()
  const onClear = vi.fn()
  render(
    <FilterDropdown fields={fields} values={values} onToggle={onToggle} onClear={onClear}>
      <button type="button">Filter</button>
    </FilterDropdown>,
  )
  return { onToggle, onClear }
}

describe('FilterDropdown', () => {
  it('lists an entry for each field, and opens its values beside it', async () => {
    renderMenu()

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Status',
      'Period',
    ])

    await userEvent.click(screen.getByRole('menuitem', { name: 'Status' }))
    expect(await screen.findByRole('menuitemcheckbox', { name: 'Failed' })).toBeInTheDocument()
  })

  it('chooses a value, shows the chosen ones, and keeps the menu open', async () => {
    const { onToggle } = renderMenu({ status: ['done'] })

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /Status/ }))
    expect(await screen.findByRole('menuitemcheckbox', { name: 'Done' })).toBeChecked()
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Failed' }))

    expect(onToggle).toHaveBeenCalledWith(fields[0], 'failed')
    expect(screen.getByRole('menuitemcheckbox', { name: 'Done' })).toBeInTheDocument()
  })

  it('offers to clear the filters only when one has a value', async () => {
    const { onClear } = renderMenu({ status: ['done'] })

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Clear filters' }))

    expect(onClear).toHaveBeenCalledOnce()
  })

  it('has no clear entry without a value', async () => {
    renderMenu()

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }))

    expect(screen.queryByRole('menuitem', { name: 'Clear filters' })).toBeNull()
  })
})
