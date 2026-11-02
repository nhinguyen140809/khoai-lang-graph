import { describe, expect, it } from 'vitest'

import {
  clearGroupTab,
  placeOpenedTab,
  setGroupTab,
  setGroupTabOrNone,
  tabIconOf,
} from '../editor-tabs.utils'
import {
  clearGroupTabCases,
  placeOpenedTabCases,
  setGroupTabCases,
  setGroupTabOrNoneCases,
} from './editor-tabs.utils.data'

describe('setGroupTab', () => {
  it.each(setGroupTabCases)('sets the tab of $name', ({ record, group, tabId, result, same }) => {
    expect(setGroupTab(record, group, tabId)).toEqual(result)
    expect(setGroupTab(record, group, tabId) === record).toBe(same)
  })
})

describe('clearGroupTab', () => {
  it.each(clearGroupTabCases)(
    'clears the tab of $name',
    ({ record, group, tabId, result, same }) => {
      expect(clearGroupTab(record, group, tabId)).toEqual(result)
      expect(clearGroupTab(record, group, tabId) === record).toBe(same)
    },
  )
})

describe('setGroupTabOrNone', () => {
  it.each(setGroupTabOrNoneCases)('sets $name', ({ record, tabId, result, same }) => {
    expect(setGroupTabOrNone(record, 'g', tabId)).toEqual(result)
    expect(setGroupTabOrNone(record, 'g', tabId) === record).toBe(same)
  })
})

describe('placeOpenedTab', () => {
  it.each(placeOpenedTabCases)('gives $name', ({ input, tabs, previewId }) => {
    const placed = placeOpenedTab(input)

    expect(placed.tabs.map(({ id }) => id)).toEqual(tabs.map(({ id }) => id))
    expect(placed.previewId).toBe(previewId)
  })
})

describe('tabIconOf', () => {
  it('reads the icon of a name from a record', () => {
    expect(tabIconOf([{ 'documents.table': 'T' }], 'documents.table')).toBe('T')
  })

  it('reads the icon of a name from a function, also for a name that no record lists', () => {
    expect(tabIconOf([(name) => `icon of ${name}`], 'runs.persona')).toBe('icon of runs.persona')
  })

  it('takes the first set that has an icon for the name', () => {
    expect(tabIconOf([{ a: 'A' }, { b: 'B' }, { b: 'other' }], 'b')).toBe('B')
  })

  it('goes on to the next set when a function gives null for the name', () => {
    expect(tabIconOf([() => null, { b: 'B' }], 'b')).toBe('B')
  })

  it('gives no icon for a name that no set has', () => {
    expect(tabIconOf([{ a: 'A' }], 'cards')).toBeUndefined()
    expect(tabIconOf([], 'cards')).toBeUndefined()
  })
})
