import { describe, expect, it } from 'vitest'

import { itemTitle } from '../search.utils'

describe('itemTitle', () => {
  it('uses the title, then the name, then the statement, then the key', () => {
    expect(itemTitle({ key: 'REQ-001', content: { title: 'Search mentors', name: 'x' } })).toBe(
      'Search mentors',
    )
    expect(itemTitle({ key: 'PER-001', content: { name: 'Student' } })).toBe('Student')
    expect(itemTitle({ key: 'AR-001', content: { statement: 'A need' } })).toBe('A need')
    expect(itemTitle({ key: 'SEC-001', content: { title: '' } })).toBe('SEC-001')
  })
})
