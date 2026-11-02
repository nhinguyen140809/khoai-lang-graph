import type { ItemInstance } from '@headless-tree/core'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Tree, TreeItem } from '../tree'

// Only what a row reads of its item.
const row = {
  getItemMeta: () => ({ level: 2 }),
  isExpanded: () => false,
  isFolder: () => false,
} as unknown as ItemInstance<unknown>

function renderRow(item: ItemInstance<unknown> = row) {
  render(
    <Tree indent={16} aria-label="Files">
      <TreeItem item={item}>Row</TreeItem>
    </Tree>,
  )
  return screen.getByText('Row')
}

describe('Tree', () => {
  it('sets the indent of its levels', () => {
    renderRow()

    expect(document.querySelector('[data-slot="tree"]')).toHaveStyle({ '--tree-indent': '16px' })
  })

  it('tells whether a row is expanded only when it holds rows', () => {
    const folder = { ...row, isFolder: () => true } as unknown as ItemInstance<unknown>

    expect(renderRow(folder)).toHaveAttribute('aria-expanded', 'false')
    document.body.replaceChildren()
    expect(renderRow()).not.toHaveAttribute('aria-expanded')
  })
})
