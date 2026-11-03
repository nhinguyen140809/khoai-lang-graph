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

function renderRow(guides: boolean, item: ItemInstance<unknown> = row) {
  render(
    <Tree guides={guides} indent={16} aria-label="Files">
      <TreeItem item={item}>Row</TreeItem>
    </Tree>,
  )
  return screen.getByText('Row')
}

describe('Tree', () => {
  it('sets the indent of its levels', () => {
    renderRow(false)

    expect(document.querySelector('[data-slot="tree"]')).toHaveStyle({ '--tree-indent': '16px' })
  })

  it('draws no guide in the rows by default', () => {
    expect(renderRow(false)).not.toHaveAttribute('data-guides')
  })

  it('draws a guide at each level in the indent of a row with guides', () => {
    const item = renderRow(true)

    expect(item).toHaveAttribute('data-guides')
    expect(item).toHaveStyle({ '--tree-padding': '32px' })
  })

  it('tells whether a row is expanded only when it holds rows', () => {
    const folder = { ...row, isFolder: () => true } as unknown as ItemInstance<unknown>

    expect(renderRow(false, folder)).toHaveAttribute('aria-expanded', 'false')
    document.body.replaceChildren()
    expect(renderRow(false)).not.toHaveAttribute('aria-expanded')
  })
})
