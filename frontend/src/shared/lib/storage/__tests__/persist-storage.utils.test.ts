import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { browserStorage } from '../browser-storage.utils'
import { parseStored, persistStorage, persistStorageByEntry } from '../persist-storage.utils'
import { parseStoredCases } from './persist-storage.utils.data'

describe('persistStorage', () => {
  it('drops writes until it is ready', async () => {
    let isReady = false
    const storage = persistStorage<{ count: number }>({ ready: () => isReady })

    await storage.setItem('test-store', { state: { count: 1 }, version: 0 })
    expect(browserStorage.getItem('test-store')).toBeNull()

    isReady = true
    await storage.setItem('test-store', { state: { count: 2 }, version: 0 })
    expect(await storage.getItem('test-store')).toEqual({ state: { count: 2 }, version: 0 })
    browserStorage.removeItem('test-store')
  })

  it('reads a stored value that is not JSON as nothing stored', async () => {
    browserStorage.setItem('test-store', '{not json')
    const storage = persistStorage<{ count: number }>()

    expect(await storage.getItem('test-store')).toBeNull()
    browserStorage.removeItem('test-store')
  })
})

describe('persistStorageByEntry', () => {
  type Counts = Record<string, number>

  /** The storage of one page whose state is counts by name, each count under a key of its own. */
  function countsStorage(ready?: () => boolean) {
    return persistStorageByEntry<Counts, number>({
      split: (counts) => counts,
      join: (entries) =>
        Object.fromEntries(
          Object.entries(entries).filter(
            (entry): entry is [string, number] => typeof entry[1] === 'number',
          ),
        ),
      ...(ready === undefined ? {} : { ready }),
    })
  }

  function write(storage: ReturnType<typeof countsStorage>, state: Counts) {
    return storage.setItem('test-store', { state, version: 0 })
  }

  afterEach(async () => {
    await countsStorage().removeItem('test-store')
  })

  it('keeps the entries that another page changed since it read them', async () => {
    await write(countsStorage(), { a: 1, b: 1 })
    const page = countsStorage()
    const otherPage = countsStorage()
    await page.getItem('test-store')
    await otherPage.getItem('test-store')

    await write(otherPage, { a: 1, b: 2 })
    await write(page, { a: 2, b: 1 })

    expect(browserStorage.getItem('test-store:a')).toBe('2')
    expect(await countsStorage().getItem('test-store')).toEqual({
      state: { a: 2, b: 2 },
      version: 0,
    })
  })

  it('removes the entries that the page knows and left out, not those another page added', async () => {
    await write(countsStorage(), { a: 1 })
    const page = countsStorage()
    await page.getItem('test-store')
    await write(countsStorage(), { c: 1 })

    await write(page, {})

    expect(await countsStorage().getItem('test-store')).toEqual({ state: { c: 1 }, version: 0 })
  })

  it('drops writes until it is ready, and reads an entry that is not JSON as nothing stored', async () => {
    let isReady = false
    const page = countsStorage(() => isReady)
    await write(page, { a: 1 })
    expect(await countsStorage().getItem('test-store')).toBeNull()

    isReady = true
    browserStorage.setItem('test-store:b', '{not json')
    await write(page, { a: 1 })

    expect(await countsStorage().getItem('test-store')).toEqual({ state: { a: 1 }, version: 0 })
  })
})

describe('parseStored', () => {
  it.each(parseStoredCases)('reads $name', ({ value, parsed }) => {
    expect(parseStored(z.object({ width: z.number() }), value)).toEqual(parsed)
  })
})
