import { describe, expect, it } from 'vitest'

import { listSentenceParts } from '../list.utils'

describe('listSentenceParts', () => {
  it('writes three things as a sentence cut into parts', () => {
    expect(listSentenceParts(['A', 'B', 'C'])).toEqual([
      { type: 'item', value: 'A' },
      { type: 'text', text: ', ' },
      { type: 'item', value: 'B' },
      { type: 'text', text: ', and ' },
      { type: 'item', value: 'C' },
    ])
  })

  it('writes two things with "and" alone', () => {
    expect(listSentenceParts(['A', 'B'])).toEqual([
      { type: 'item', value: 'A' },
      { type: 'text', text: ' and ' },
      { type: 'item', value: 'B' },
    ])
  })

  it('writes one thing with no words between', () => {
    expect(listSentenceParts(['A'])).toEqual([{ type: 'item', value: 'A' }])
    expect(listSentenceParts([])).toEqual([])
  })

  it('keeps things that are not strings, such as the items of a list of links', () => {
    const first = { id: 'a' }
    const second = { id: 'b' }

    expect(listSentenceParts([first, second])).toEqual([
      { type: 'item', value: first },
      { type: 'text', text: ' and ' },
      { type: 'item', value: second },
    ])
  })
})
