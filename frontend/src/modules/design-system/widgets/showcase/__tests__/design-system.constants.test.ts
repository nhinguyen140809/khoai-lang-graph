import { describe, expect, it } from 'vitest'

import { cards } from '../components/cards'
import { pendingComponents } from '../design-system.constants'
import { sections } from '../design-system.types'

// Every card file of the folder, with what it exports.
const cardFiles = import.meta.glob('../components/cards/*/*Card.tsx', {
  eager: true,
}) as Record<string, Record<string, unknown>>

describe('cards', () => {
  it('keeps each card file in the folder of its tab', () => {
    const misplaced = Object.entries(cardFiles).flatMap(([path, exports]) =>
      Object.entries(exports)
        .filter(([name]) => name.endsWith('CardEntry'))
        .map(([, entry]) => ({ path, section: (entry as { section: string }).section }))
        .filter(({ path, section }) => !path.includes(`/cards/${section}/`))
        .map(({ path }) => path),
    )
    expect(Object.keys(cardFiles).length).toBeGreaterThan(30)
    expect(misplaced).toEqual([])
  })

  it('lists the entry of every card file', () => {
    const unlisted = Object.entries(cardFiles).flatMap(([path, exports]) => {
      const entries = Object.entries(exports).filter(([name]) => name.endsWith('CardEntry'))
      if (entries.length === 0) return [`${path}: exports no entry`]
      return entries
        .filter(([, entry]) => !(cards as readonly unknown[]).includes(entry))
        .map(([name]) => `${path}: ${name} is not in cards`)
    })
    expect(unlisted).toEqual([])
  })

  it('has a unique id per card', () => {
    const ids = cards.map((card) => card.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('places every card in a tab that exists', () => {
    const tabs = new Set<string>(sections.map((section) => section.id))
    expect(cards.filter((card) => !tabs.has(card.section))).toEqual([])
  })

  it('gives every tab at least one card', () => {
    const used = new Set<string>(cards.map((card) => card.section))
    expect(sections.filter((section) => !used.has(section.id))).toEqual([])
  })
})

// The places whose components the design system must show: the barrel of each folder of
// shared/components, and each file of shared/components/ui.
const modules = import.meta.glob([
  '/src/shared/components/*/index.ts',
  '/src/shared/components/ui/*.tsx',
]) as Record<string, () => Promise<Record<string, unknown>>>

// The code of the page, as text, without the files that only list names.
const sources = import.meta.glob(
  [
    '/src/modules/design-system/**/*.{ts,tsx}',
    '!/src/modules/design-system/**/__tests__/**',
    '!/src/modules/design-system/**/design-system.constants.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const pending = Object.values(pendingComponents).flat()

const shownWords = new Set(Object.values(sources).flatMap((code) => code.match(/\w+/g) ?? []))

function isComponent(name: string, value: unknown): boolean {
  if (!/^[A-Z]/.test(name)) return false
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && '$$typeof' in value)
  )
}

async function exportedComponents(): Promise<string[]> {
  const names = new Set<string>()
  for (const load of Object.values(modules)) {
    const exports = await load()
    for (const [name, value] of Object.entries(exports)) {
      if (isComponent(name, value)) names.add(name)
    }
  }
  return [...names]
}

describe('design system coverage', () => {
  it('shows every component of shared/components, or lists it as pending', async () => {
    const missing = (await exportedComponents()).filter(
      (name) => !shownWords.has(name) && !pending.includes(name),
    )
    expect(missing).toEqual([])
  }, 60_000)

  it('lists as pending only a component that exists and is not shown yet', async () => {
    const existing = new Set(await exportedComponents())
    const stale = pending.filter((name) => !existing.has(name) || shownWords.has(name))
    expect(stale).toEqual([])
  }, 60_000)
})
