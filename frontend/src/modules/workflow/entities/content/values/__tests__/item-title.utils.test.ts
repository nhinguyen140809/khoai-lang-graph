import { describe, expect, it } from 'vitest'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'

import { fieldText, itemTitle } from '../item-title.utils'
import { itemTitleCases } from './item-title.utils.data'

describe('itemTitle', () => {
  it.each(itemTitleCases)('names an item by $name', ({ kind, item, title }) => {
    expect(itemTitle(kind === null ? undefined : contentSchemaFixtureByKind(kind), item)).toBe(
      title,
    )
  })
})

describe('fieldText', () => {
  it.each([
    { name: 'a text', value: 'Mentor', text: 'Mentor' },
    { name: 'only whitespace', value: '  ', text: null },
    { name: 'a number', value: 3, text: null },
    { name: 'a missing field', value: undefined, text: null },
  ])('reads $name', ({ value, text }) => {
    expect(fieldText({ content: { title: value } }, 'title')).toBe(text)
  })
})
