import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { browserStorage, parseStored, persistStorage } from '../browser-storage.utils'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('browserStorage', () => {
  it('reads what it wrote, and null for a missing key', () => {
    browserStorage.setItem('test-key', 'value')

    expect(browserStorage.getItem('test-key')).toBe('value')

    browserStorage.removeItem('test-key')
    expect(browserStorage.getItem('test-key')).toBeNull()
  })

  it('drops a write when the storage is full, and reads null when it is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })

    expect(() => {
      browserStorage.setItem('test-key', 'value')
    }).not.toThrow()
    expect(browserStorage.getItem('test-key')).toBeNull()
  })

  it('throws an error that does not come from the storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new TypeError('A bug')
    })

    expect(() => browserStorage.getItem('test-key')).toThrow('A bug')
  })
})

describe('persistStorage', () => {
  it('drops writes until it is ready', async () => {
    let ready = false
    const storage = persistStorage<{ count: number }>({ ready: () => ready })

    await storage.setItem('test-store', { state: { count: 1 }, version: 0 })
    expect(browserStorage.getItem('test-store')).toBeNull()

    ready = true
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

describe('parseStored', () => {
  it('returns stored state of the expected shape, and undefined otherwise', () => {
    const schema = z.object({ width: z.number() })

    expect(parseStored(schema, { width: 260 })).toEqual({ width: 260 })
    expect(parseStored(schema, { width: '260' })).toBeUndefined()
    expect(parseStored(schema, undefined)).toBeUndefined()
  })
})
