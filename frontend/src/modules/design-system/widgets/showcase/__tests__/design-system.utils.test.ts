import { describe, expect, it } from 'vitest'

import { cards } from '../components/cards'
import { sections } from '../design-system.types'
import { rankCards, sectionOf, toHex } from '../design-system.utils'

describe('toHex', () => {
  it('writes an rgb color as hex', () => {
    expect(toHex('rgb(55, 85, 205)')).toBe('#3755cd')
  })

  it('adds the alpha of a color with some transparency', () => {
    expect(toHex('rgba(0, 0, 0, 0.5)')).toBe('#00000080')
  })

  it('leaves a color that is opaque without an alpha pair', () => {
    expect(toHex('rgba(255, 255, 255, 1)')).toBe('#ffffff')
  })

  it('returns any other form as it came', () => {
    expect(toHex('color(srgb 0.1 0.2 0.3)')).toBe('color(srgb 0.1 0.2 0.3)')
  })
})

describe('sectionOf', () => {
  const ids = ['foundations', 'content'] as const

  it('returns the tab that the value names', () => {
    expect(sectionOf('content', ids, 'foundations')).toBe('content')
  })

  it('returns the first tab for a missing or unknown value', () => {
    expect(sectionOf(null, ids, 'foundations')).toBe('foundations')
    expect(sectionOf('other', ids, 'foundations')).toBe('foundations')
  })
})

describe('rankCards', () => {
  const labelOf = (card: { section: string }) =>
    sections.find((section) => section.id === card.section)?.label ?? ''
  const best = (search: string) => rankCards(cards, labelOf, search)[0]?.id

  it('puts the card that is named by the search first', () => {
    expect(best('icon')).toBe('icons')
    expect(best('badge')).toBe('badges')
    expect(best('thumbnail')).toBe('thumbnails')
  })

  it('puts the card of the exact name before the longer names that start the same', () => {
    expect(best('act')).toBe('acts')
  })

  it('does not list the cards that only have the letters scattered in their words', () => {
    const found = rankCards(cards, labelOf, 'chart').map((card) => card.id)
    expect(found[0]).toBe('chart')
    // Only the cards that name the word, not the cards with its letters spread over long keywords.
    expect(found.length).toBeLessThanOrEqual(3)
  })

  it('finds a card by a component it shows', () => {
    expect(best('dropdownmenu')).toBe('overlays')
  })

  it('keeps every card, in order, without a search', () => {
    expect(rankCards(cards, labelOf, ' ')).toEqual([...cards])
  })

  it('finds nothing for a word that no card has', () => {
    expect(rankCards(cards, labelOf, 'zzzzqq')).toEqual([])
  })
})
