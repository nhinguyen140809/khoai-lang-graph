import { afterEach, describe, expect, it, vi } from 'vitest'

import { browserStorage, storageKey } from '../browser-storage.utils'

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

  it('lists the keys that start with a prefix, and none for a storage that is blocked', () => {
    browserStorage.setItem('prefix-a', '1')
    browserStorage.setItem('prefix-b', '2')
    browserStorage.setItem('other-a', '3')

    expect(browserStorage.keysStartingWith('prefix-').toSorted()).toEqual(['prefix-a', 'prefix-b'])
    expect(browserStorage.keysStartingWith('missing-')).toEqual([])

    vi.spyOn(Storage.prototype, 'key').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })
    expect(browserStorage.keysStartingWith('prefix-')).toEqual([])
    vi.restoreAllMocks()
    for (const key of ['prefix-a', 'prefix-b', 'other-a']) browserStorage.removeItem(key)
  })

  it('throws an error that does not come from the storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new TypeError('A bug')
    })

    expect(() => browserStorage.getItem('test-key')).toThrow('A bug')
  })
})

describe('storageKey', () => {
  it('starts the key with the name of the app', () => {
    expect(storageKey('frame')).toBe('khoailanggraph-frame')
  })
})
