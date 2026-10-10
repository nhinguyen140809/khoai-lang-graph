import { describe, expect, it } from 'vitest'

import { fieldLabel, formatFieldValue, itemTitle } from '../search.utils'

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

describe('formatFieldValue', () => {
  it('shows text, numbers and lists, and a dash for an empty field', () => {
    expect(formatFieldValue('text')).toBe('text')
    expect(formatFieldValue(3)).toBe('3')
    expect(formatFieldValue(['a', 'b'])).toBe('a\nb')
    expect(formatFieldValue(null)).toBe('-')
    expect(formatFieldValue('')).toBe('-')
  })
})

describe('fieldLabel', () => {
  it('reads a field name as a label', () => {
    expect(fieldLabel('acceptance_criteria')).toBe('Acceptance criteria')
  })
})
