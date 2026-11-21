import { describe, expect, it } from 'vitest'

import { itemAnchorId, itemAnchorProps, itemNodeId } from '../item-anchor.utils'

describe('itemAnchorId', () => {
  it('names the anchor of an item on the page of its document', () => {
    expect(itemAnchorId('i1')).toBe('item-i1')
    expect(itemAnchorId('i1')).not.toBe(itemNodeId('i1'))
  })
})

describe('itemAnchorProps', () => {
  it('ties the block of an item to the address of the page', () => {
    expect(itemAnchorProps('i1', null)).toEqual({ id: 'item-i1', tabIndex: -1 })
    expect(itemAnchorProps('i1', 'i2')).toEqual({ id: 'item-i1', tabIndex: -1 })
  })

  it('marks the block of the item that the address names, as a target of the focus', () => {
    expect(itemAnchorProps('i1', 'i1')).toEqual({
      id: 'item-i1',
      tabIndex: -1,
      'data-target': '',
    })
  })
})
