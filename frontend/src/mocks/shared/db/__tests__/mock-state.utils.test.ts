import { afterEach, describe, expect, it, vi } from 'vitest'

import { browserStorage, storageKey } from '@/shared/lib/storage'

import type * as mockDb from '../mock-state.utils'

// The module keeps whether records go to browser storage, so each test loads its own copy.
async function loadMockDb(): Promise<typeof mockDb> {
  vi.resetModules()
  return import('../mock-state.utils')
}

const storedKey = storageKey('mock:counter')

afterEach(() => {
  browserStorage.removeItem(storedKey)
})

describe('mockState', () => {
  it('starts from its initial value, read only when first asked for', async () => {
    const { mockState } = await loadMockDb()
    const initial = vi.fn(() => ({ count: 1 }))

    const record = mockState('counter', initial)
    expect(initial).not.toHaveBeenCalled()

    expect(record.get()).toEqual({ count: 1 })
    expect(record.get()).toEqual({ count: 1 })
    expect(initial).toHaveBeenCalledTimes(1)
  })

  it('keeps what is set, in memory only by default', async () => {
    const { mockState } = await loadMockDb()
    const record = mockState('counter', () => ({ count: 1 }))

    record.set({ count: 2 })

    expect(record.get()).toEqual({ count: 2 })
    expect(browserStorage.getItem(storedKey)).toBeNull()
  })

  it('starts again from the initial value after a reset', async () => {
    const { mockState, resetMockData } = await loadMockDb()
    const record = mockState('counter', () => ({ count: 1 }))
    record.set({ count: 2 })

    resetMockData()

    expect(record.get()).toEqual({ count: 1 })
  })
})

describe('mockState kept in the browser', () => {
  it('writes to browser storage, and a new page reads it back', async () => {
    const first = await loadMockDb()
    first.keepMockDataInBrowser()
    first.mockState('counter', () => ({ count: 1 })).set({ count: 2 })
    expect(browserStorage.getItem(storedKey)).toBe('{"count":2}')

    const reloaded = await loadMockDb()
    reloaded.keepMockDataInBrowser()

    expect(reloaded.mockState('counter', () => ({ count: 1 })).get()).toEqual({ count: 2 })
  })

  it('starts from the initial value when the stored value cannot be read', async () => {
    browserStorage.setItem(storedKey, '{not json')
    const { keepMockDataInBrowser, mockState } = await loadMockDb()
    keepMockDataInBrowser()

    expect(mockState('counter', () => ({ count: 1 })).get()).toEqual({ count: 1 })
  })

  it('forgets the stored values on a reset', async () => {
    const { keepMockDataInBrowser, mockState, resetMockData } = await loadMockDb()
    keepMockDataInBrowser()
    mockState('counter', () => ({ count: 1 })).set({ count: 2 })

    resetMockData()

    expect(browserStorage.getItem(storedKey)).toBeNull()
  })
})
