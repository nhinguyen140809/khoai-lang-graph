import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { FilterValues } from '../filter.types'
import { FilterMenu } from '../FilterMenu'
import { testFields } from './filter.reducer.data'

function renderMenu(values: FilterValues = {}) {
  const onApply = vi.fn()
  render(<FilterMenu fields={testFields} values={values} onApply={onApply} />)
  return { onApply }
}

async function openMenu() {
  await userEvent.click(screen.getByRole('button', { name: /^Filter/ }))
  return screen.findByRole('dialog', { name: 'Filters' })
}

describe('FilterMenu', () => {
  it('applies the values chosen, one value at most for a filter of one value', async () => {
    const { onApply } = renderMenu()
    await openMenu()

    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(screen.getByRole('button', { name: 'Closed' }))
    await userEvent.click(screen.getByRole('button', { name: 'In the last day' }))
    await userEvent.click(screen.getByRole('button', { name: 'In the last 7 days' }))
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(onApply).toHaveBeenCalledWith({ status: ['open', 'closed'], period: ['7'] })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('counts the filters applied, and opens on their values', async () => {
    renderMenu({ status: ['closed'], period: ['1'] })

    expect(screen.getByRole('button', { name: 'Filter, 2 applied' })).toBeInTheDocument()
    await openMenu()
    expect(screen.getByRole('button', { name: 'Closed' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('drops what was chosen when it closes without Apply', async () => {
    const { onApply } = renderMenu()
    await openMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))

    await userEvent.keyboard('{Escape}')
    await openMenu()

    expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('aria-pressed', 'false')
    expect(onApply).not.toHaveBeenCalled()
  })

  it('clears the values with Clear filters, which waits for something to clear', async () => {
    const { onApply } = renderMenu({ status: ['open'] })
    await openMenu()

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(onApply).toHaveBeenCalledWith({})
  })

  it('has nothing to clear without a value', async () => {
    renderMenu()
    await openMenu()

    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled()
  })
})
