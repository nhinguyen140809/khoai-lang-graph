import { beforeEach, describe, expect, it } from 'vitest'

import { browserStorage } from '@/shared/lib/browser-storage.utils'

import { neighborTab, useEditorTabsStore } from '../editor-tabs.store'

const STORAGE_KEY = useEditorTabsStore.persist.getOptions().name ?? ''
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
  useEditorTabsStore.setState(useEditorTabsStore.getInitialState())
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

  it('opens a new tab next to the tab shown last, also after its page left the screen', () => {
    const { openTab, leaveTab } = useEditorTabsStore.getState()
    openTab('p1:search', req)
    openTab('p1:search', ambiguity)
    openTab('p1:search', req)

    leaveTab('p1:search', req.id)
    expect(useEditorTabsStore.getState().onScreen['p1:search']).toBeUndefined()
    openTab('p1:search', conflict)

    expect(useEditorTabsStore.getState().groups['p1:search']?.map(({ id }) => id)).toEqual([
      'i1',
      'i3',
      'i2',
    ])
    expect(useEditorTabsStore.getState().onScreen['p1:search']).toBe(conflict.id)
  })

  it('opens a new tab last once the tab shown last is closed', () => {
    const { openTab, closeTab } = useEditorTabsStore.getState()
    openTab('p1:search', ambiguity)
    openTab('p1:search', req)

    closeTab('p1:search', req.id)
    openTab('p1:search', conflict)

    expect(useEditorTabsStore.getState().groups['p1:search']?.map(({ id }) => id)).toEqual([
      'i2',
      'i3',
    ])
  })

  it('keeps tabs opened before the stored tabs were read', async () => {
    browserStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        // lastHrefs is a field of an older version, which the store leaves out.
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
        state: { groups: { 'p1:search': [{ id: 1 }] } },
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
