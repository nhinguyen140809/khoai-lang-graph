import { describe, expect, it } from 'vitest'

import { isLinkOutOfDate, linkKeyOf, linkSentence, parseLinkKey } from '../trace-links.utils'
import { outOfDateCases } from './trace-links.utils.data'

describe('isLinkOutOfDate', () => {
  it.each(outOfDateCases)('answers for $name', ({ link, target, expected }) => {
    expect(isLinkOutOfDate(link, target)).toBe(expected)
  })
})

describe('linkKeyOf', () => {
  it('names a link of one item by the item and the link', () => {
    const key = linkKeyOf('5f2d0000', 'l-42')

    expect(key).toBe('5f2d0000@l-42')
    expect(parseLinkKey(key)).toEqual({ sourceItemId: '5f2d0000', linkId: 'l-42' })
  })

  it('refuses a key that names no item and no link', () => {
    expect(() => parseLinkKey('a-key-of-nothing')).toThrow()
  })
})

describe('linkSentence', () => {
  it.each([
    {
      tense: 'the sentence of the link as it is',
      when: 'now' as const,
      sentence: 'Layered booking flow is based on Students book a session at once.',
    },
    {
      tense: 'the sentence of the link at its making',
      when: 'will' as const,
      sentence: 'Layered booking flow will be based on Students book a session at once.',
    },
    {
      tense: 'the sentence of the link after its removal',
      when: 'noLonger' as const,
      sentence: 'Layered booking flow will no longer be based on Students book a session at once.',
    },
  ])('writes $tense', ({ when, sentence }) => {
    expect(
      linkSentence(
        'Layered booking flow',
        { key: 'derived_from', title: 'Based on' },
        'Students book a session at once',
        { tense: when },
      ),
    ).toBe(sentence)
  })

  it('reads the words of the interview through the same sentence', () => {
    expect(
      linkSentence(
        'Students book a session at once',
        { key: 'evidenced_by', title: 'Evidenced by' },
        'I want to book without writing to anyone',
        { tense: 'now' },
      ),
    ).toBe(
      'Students book a session at once is evidenced by I want to book without writing to anyone.',
    )
  })

  it('reads the words of its type in the tense asked', () => {
    expect(
      linkSentence(
        'Fast has no number',
        { key: 'concerns', title: 'Applies to' },
        'Search mentors',
        { tense: 'now' },
      ),
    ).toBe('Fast has no number applies to Search mentors.')
    expect(
      linkSentence(
        'Fast has no number',
        { key: 'concerns', title: 'Applies to' },
        'Search mentors',
        { tense: 'noLonger' },
      ),
    ).toBe('Fast has no number will no longer apply to Search mentors.')
  })

  it('says that the item has a link of a type it holds no words for', () => {
    expect(
      linkSentence(
        'Fast has no number',
        { key: 'made_with', title: 'Made with' },
        'Search mentors',
        { tense: 'now' },
      ),
    ).toBe('Fast has no number has a "Made with" link to Search mentors.')
    expect(
      linkSentence(
        'Fast has no number',
        { key: 'made_with', title: 'Made with' },
        'Search mentors',
        { tense: 'will' },
      ),
    ).toBe('Fast has no number will have a "Made with" link to Search mentors.')
  })
})
