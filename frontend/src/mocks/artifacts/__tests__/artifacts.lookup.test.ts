import { describe, expect, it } from 'vitest'

import { assertPresent } from '@/shared/lib/guards'

import { allItems, atVersion, itemAtVersion, itemRevisions } from '../artifacts.lookup'
import { artifactAtV3, atVersionCases, revisions } from './artifacts.lookup.data'

describe('atVersion', () => {
  it.each(atVersionCases)('reads $name', ({ version, title }) => {
    expect(atVersion(artifactAtV3, revisions, version)?.content.title ?? null).toBe(title)
  })

  it('gives the version, the author and the time of the version read', () => {
    expect(atVersion(artifactAtV3, revisions, 2)).toMatchObject({
      version: 2,
      updated_at: '2026-01-02T00:00:00Z',
    })
  })
})

describe('itemAtVersion', () => {
  const item = assertPresent(
    allItems().find((entry) => itemRevisions(entry).length > 1),
    'The fixtures hold no item with a history',
  )

  it('keeps the number of an item read as it is now', () => {
    expect(itemAtVersion(item, null)).toBe(item)
  })

  it('keeps the number of an item read at a version', () => {
    expect(itemAtVersion(item, 1)).toMatchObject({
      version: 1,
      outline_number: item.outline_number,
    })
  })

  it('reads nothing at a version that the item never had', () => {
    expect(itemAtVersion(item, 999)).toBeUndefined()
  })
})
