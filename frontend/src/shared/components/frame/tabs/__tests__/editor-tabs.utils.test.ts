import { describe, expect, it } from 'vitest'

import { clearGroupTab, setGroupTab } from '../editor-tabs.utils'
import { clearGroupTabCases, setGroupTabCases } from './editor-tabs.utils.data'

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
