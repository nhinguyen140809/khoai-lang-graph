import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  expectAttribute,
  expectDisabled,
  expectEnabled,
  expectNoRole,
  expectRole,
  pressButton,
  pressEscape,
} from '@/test/steps'

import type { FilterValues } from '../filter.types'
import { FilterMenu } from '../FilterMenu'
import { testFields } from './filter.reducer.data'

function renderMenu(values: FilterValues = {}) {
  const onApply = vi.fn()
  render(<FilterMenu fields={testFields} values={values} onApply={onApply} />)
  return { onApply }
}

async function openMenu() {
  await pressButton(/^Filter/)
  return screen.findByRole('dialog', { name: 'Filters' })
}

describe('FilterMenu', () => {
  it('applies the values chosen, one value at most for a filter of one value', async () => {
    const { onApply } = renderMenu()
    await openMenu()

    await pressButton('Open')
    await pressButton('Closed')
    await pressButton('In the last day')
    await pressButton('In the last 7 days')
    await pressButton('Apply')

    expect(onApply).toHaveBeenCalledWith({ status: ['open', 'closed'], period: ['7'] })
    expectNoRole('dialog')
  })

  it('counts the filters applied, and opens on their values', async () => {
    renderMenu({ status: ['closed'], period: ['1'] })

    await expectRole('button', 'Filter, 2 applied')
    await openMenu()
    expectAttribute('button', 'Closed', 'aria-pressed', 'true')
    expectAttribute('button', 'Open', 'aria-pressed', 'false')
  })

  it('drops what was chosen when it closes without Apply', async () => {
    const { onApply } = renderMenu()
    await openMenu()
    await pressButton('Open')

    await pressEscape()
    await openMenu()

    expectAttribute('button', 'Open', 'aria-pressed', 'false')
    expect(onApply).not.toHaveBeenCalled()
  })

  it('clears the values with Clear filters, which waits for something to clear', async () => {
    const { onApply } = renderMenu({ status: ['open'] })
    await openMenu()

    await pressButton('Clear filters')
    expectEnabled('button', 'Clear filters')
    await pressButton('Apply')

    expect(onApply).toHaveBeenCalledWith({})
  })

  it('has nothing to clear without a value', async () => {
    renderMenu()
    await openMenu()

    expectDisabled('button', 'Clear filters')
  })
})
