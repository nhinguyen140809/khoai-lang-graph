import { afterEach, describe, expect, it, vi } from 'vitest'

import { browserStorage, storageKey } from '@/shared/lib/browser-storage.utils'

import type * as mockDb from '../mock-db.utils'

// The module keeps whether records go to browser storage, so each test loads its own copy.
async function loadMockDb(): Promise<typeof mockDb> {
  vi.resetModules()
  return import('../mock-db.utils')
}

const storedKey = storageKey('mock:counter')

afterEach(() => {
  browserStorage.removeItem(storedKey)
})

describe('mockRecord', () => {
  it('starts from its initial value, read only when first asked for', async () => {
    const { mockRecord } = await loadMockDb()
    const initial = vi.fn(() => ({ count: 1 }))

    const record = mockRecord('counter', initial)
    expect(initial).not.toHaveBeenCalled()

    expect(record.get()).toEqual({ count: 1 })
    expect(record.get()).toEqual({ count: 1 })
    expect(initial).toHaveBeenCalledTimes(1)
  })

  it('keeps what is set, in memory only by default', async () => {
    const { mockRecord } = await loadMockDb()
    const record = mockRecord('counter', () => ({ count: 1 }))

    record.set({ count: 2 })

    expect(record.get()).toEqual({ count: 2 })
    expect(browserStorage.getItem(storedKey)).toBeNull()
  })

  it('starts again from the initial value after a reset', async () => {
    const { mockRecord, resetMockData } = await loadMockDb()
    const record = mockRecord('counter', () => ({ count: 1 }))
    record.set({ count: 2 })

    resetMockData()

    expect(record.get()).toEqual({ count: 1 })
  })
})

describe('mockRecord kept in the browser', () => {
  it('writes to browser storage, and a new page reads it back', async () => {
    const first = await loadMockDb()
    first.keepMockDataInBrowser()
    first.mockRecord('counter', () => ({ count: 1 })).set({ count: 2 })
    expect(browserStorage.getItem(storedKey)).toBe('{"count":2}')

    const reloaded = await loadMockDb()
    reloaded.keepMockDataInBrowser()

    expect(reloaded.mockRecord('counter', () => ({ count: 1 })).get()).toEqual({ count: 2 })
  })

  it('starts from the initial value when the stored value cannot be read', async () => {
    browserStorage.setItem(storedKey, '{not json')
    const { keepMockDataInBrowser, mockRecord } = await loadMockDb()
    keepMockDataInBrowser()

    expect(mockRecord('counter', () => ({ count: 1 })).get()).toEqual({ count: 1 })
  })

  it('forgets the stored values on a reset', async () => {
    const { keepMockDataInBrowser, mockRecord, resetMockData } = await loadMockDb()
    keepMockDataInBrowser()
    mockRecord('counter', () => ({ count: 1 })).set({ count: 2 })

    resetMockData()

    expect(browserStorage.getItem(storedKey)).toBeNull()
  })
})
