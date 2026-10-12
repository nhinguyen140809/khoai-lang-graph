import { beforeEach, describe, expect, it } from 'vitest'

import { browserStorage } from '@/lib/browser-storage.utils'

import { neighborTab, useEditorTabsStore } from '../editor-tabs.store'

const STORAGE_KEY = 'khoailanggraph-editor-tabs'
const req = { id: 'i1', title: 'REQ-001', href: '/projects/p1/search/i1' }
const ambiguity = { id: 'i2', title: 'AMB-001', href: '/projects/p1/search/i2' }
const conflict = {
  id: 'i3',
  title: 'CONF-001',
  href: '/projects/p1/search/i3',
  icon: 'item' as const,
}

beforeEach(() => {
  browserStorage.removeItem(STORAGE_KEY)
  useEditorTabsStore.setState({ groups: {}, lastHrefs: {} })
})

describe('useEditorTabsStore', () => {
  it('opens a tab once and updates its title', () => {
    const { openTab } = useEditorTabsStore.getState()

    openTab('p1:search', req)
    openTab('p1:search', ambiguity)
    openTab('p1:search', { ...req, title: 'Renamed' })

    expect(useEditorTabsStore.getState().groups['p1:search']).toEqual([
      { ...req, title: 'Renamed' },
      ambiguity,
    ])
  })

  it('opens a new tab next to the tab of the page shown before', () => {
    const { openTab } = useEditorTabsStore.getState()
    openTab('p1:search', req)
    openTab('p1:search', ambiguity)

    openTab('p1:search', conflict, { after: req.href })

    expect(useEditorTabsStore.getState().groups['p1:search']?.map(({ id }) => id)).toEqual([
      'i1',
      'i3',
      'i2',
    ])
  })

  it('forgets the last address of a group when its tab closes', () => {
    const { openTab, setLastHref, closeTab } = useEditorTabsStore.getState()
    openTab('p1:search', req)
    setLastHref('p1:search', req.href)

    closeTab('p1:search', req.id)

    expect(useEditorTabsStore.getState().groups['p1:search']).toEqual([])
    expect(useEditorTabsStore.getState().lastHrefs['p1:search']).toBeUndefined()
  })

  it('keeps tabs opened before the stored tabs were read', async () => {
    browserStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { groups: { 'p1:search': [ambiguity] }, lastHrefs: {} },
        version: 0,
      }),
    )
    useEditorTabsStore.getState().openTab('p1:search', req)

    await useEditorTabsStore.persist.rehydrate()

    expect(useEditorTabsStore.getState().groups['p1:search']).toEqual([ambiguity, req])
  })

  it('drops stored tabs that do not have the expected shape', async () => {
    browserStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { groups: { 'p1:search': [{ id: 1 }] }, lastHrefs: {} },
        version: 0,
      }),
    )

    await useEditorTabsStore.persist.rehydrate()

    expect(useEditorTabsStore.getState().groups).toEqual({})
  })
})

describe('neighborTab', () => {
  it('is the next tab, else the previous one', () => {
    expect(neighborTab([req, ambiguity], req.id)).toBe(ambiguity)
    expect(neighborTab([req, ambiguity], ambiguity.id)).toBe(req)
    expect(neighborTab([req], req.id)).toBeUndefined()
  })
})
