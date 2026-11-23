import { defaultFilter } from 'cmdk'

import type { MotionDemoMotion } from '@/shared/components/act'
import { foldText } from '@/shared/lib/text'

/**
 * The hex code of a color that the browser reports as `rgb(...)` or `rgba(...)`; any other form is
 * returned as it came, and a color with some transparency gets its alpha as a fourth pair.
 */
export function toHex(color: string): string {
  const match = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,/\s]+([\d.]+%?))?\s*\)$/.exec(color)
  if (match === null) return color
  const pair = (value: number) => Math.round(value).toString(16).padStart(2, '0')
  const [, red = '0', green = '0', blue = '0', alpha] = match
  const hex = `#${pair(Number(red))}${pair(Number(green))}${pair(Number(blue))}`
  if (alpha === undefined) return hex
  const share = alpha.endsWith('%') ? Number.parseFloat(alpha) / 100 : Number(alpha)
  return share >= 1 ? hex : `${hex}${pair(share * 255)}`
}

/** The tab that a query value names, or `fallback` when it names none. */
export function sectionOf<Id extends string>(
  value: string | null,
  ids: readonly Id[],
  fallback: Id,
): Id {
  return ids.find((id) => id === value) ?? fallback
}

/**
 * How well a card matches a search, from 0 (no match) to 1. The name of the card matches loosely,
 * as cmdk does, so that "bdg" finds Badges, and counts in full. Its other words and the name of
 * its tab count for half and must contain the search as written: a loose match over such a long
 * text finds nearly every card. Case and accents do not matter.
 */
export function cardScore(
  card: { label: string; keywords: string },
  sectionLabel: string,
  search: string,
): number {
  const wanted = foldText(search)
  const byName = defaultFilter(foldText(card.label), wanted)
  const hasWord = foldText(`${card.keywords} ${sectionLabel}`).includes(wanted)
  return Math.max(byName, hasWord ? 0.5 : 0)
}

/**
 * The cards that match a search, the best match first, and of those that match as well the one
 * with the shorter name. Without a search every card stays, in its order.
 */
export function rankCards<Card extends { label: string; keywords: string; section: string }>(
  cards: readonly Card[],
  sectionLabelOf: (card: Card) => string,
  search: string,
): Card[] {
  if (search.trim() === '') return [...cards]
  return (
    cards
      .map((card) => ({ card, score: cardScore(card, sectionLabelOf(card), search) }))
      .filter(({ score }) => score > 0)
      // Of two cards that match as well, the shorter name is the closer one: "Acts" before "Act moods".
      .toSorted((a, b) => b.score - a.score || a.card.label.length - b.card.label.length)
      .map(({ card }) => card)
  )
}

/** The names of a vocabulary, as the names that it holds. */
export function keysOf<Vocabulary extends object>(
  vocabulary: Vocabulary,
): (keyof Vocabulary & string)[] {
  return Object.keys(vocabulary) as (keyof Vocabulary & string)[]
}

/** The demonstrations with what all of them share, which each may say otherwise. */
export function withDefaults(
  looks: Record<string, MotionDemoMotion>,
  defaults: MotionDemoMotion,
): Record<string, MotionDemoMotion> {
  return Object.fromEntries(
    Object.entries(looks).map(([name, motion]) => [name, { ...defaults, ...motion }]),
  )
}

/** One demonstration for each name of a vocabulary, in the order of the vocabulary: `motionOf` says what the name does. */
export function lookOf<Name extends string>(
  names: readonly Name[],
  motionOf: (name: Name) => MotionDemoMotion,
): Record<string, MotionDemoMotion> {
  return Object.fromEntries(names.map((name) => [name, motionOf(name)]))
}
