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

    openTab('p1:search', req, { keep: true })
    openTab('p1:search', ambiguity, { keep: true })
    openTab('p1:search', { ...req, title: 'Renamed' })

    expect(useEditorTabsStore.getState().groups['p1:search']).toEqual([
      { ...req, title: 'Renamed' },
      ambiguity,
    ])
  })

  it('opens a new tab next to the tab shown last, also after its page left the screen', () => {
    const { openTab, leaveTab } = useEditorTabsStore.getState()
    openTab('p1:search', req, { keep: true })
    openTab('p1:search', ambiguity, { keep: true })
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
    openTab('p1:search', ambiguity, { keep: true })
    openTab('p1:search', req, { keep: true })

    closeTab('p1:search', req.id)
    openTab('p1:search', conflict)

    expect(useEditorTabsStore.getState().groups['p1:search']?.map(({ id }) => id)).toEqual([
      'i2',
      'i3',
    ])
  })

  it('opens a new page in the preview tab, in the place of the preview tab open', () => {
    const { openTab } = useEditorTabsStore.getState()
    openTab('p1:search', req, { keep: true })
    openTab('p1:search', ambiguity)
    openTab('p1:search', req)

    openTab('p1:search', conflict)

    const state = useEditorTabsStore.getState()
    expect(state.groups['p1:search']?.map(({ id }) => id)).toEqual(['i1', 'i3'])
    expect(state.preview['p1:search']).toBe(conflict.id)
  })

  it('opens a kept tab next to the tab shown last, and leaves the preview tab', () => {
    const { openTab } = useEditorTabsStore.getState()
    openTab('p1:search', req)

    openTab('p1:search', ambiguity, { keep: true })

    const state = useEditorTabsStore.getState()
    expect(state.groups['p1:search']?.map(({ id }) => id)).toEqual(['i1', 'i2'])
    expect(state.preview['p1:search']).toBe(req.id)
  })

  it('keeps the preview tab, so the next page opens a new preview tab', () => {
    const { openTab, keepTab } = useEditorTabsStore.getState()
    openTab('p1:search', req)

    keepTab('p1:search', req.id)
    openTab('p1:search', ambiguity)

    const state = useEditorTabsStore.getState()
    expect(state.groups['p1:search']?.map(({ id }) => id)).toEqual(['i1', 'i2'])
    expect(state.preview['p1:search']).toBe(ambiguity.id)
  })

  it('keeps a page asked to be kept, at once when its tab is open, else when it opens', () => {
    const { openTab, keepPage } = useEditorTabsStore.getState()
    openTab('p1:search', req)

    keepPage(req.href)
    expect(useEditorTabsStore.getState().preview['p1:search']).toBeUndefined()
    keepPage(ambiguity.href)
    openTab('p1:search', ambiguity)

    const state = useEditorTabsStore.getState()
    expect(state.groups['p1:search']?.map(({ id }) => id)).toEqual(['i1', 'i2'])
    expect(state.preview['p1:search']).toBeUndefined()
    expect(state.keepNext).toBeNull()
  })

  it('closes several tabs at once', () => {
    const { openTab, closeTabs } = useEditorTabsStore.getState()
    openTab('p1:search', req, { keep: true })
    openTab('p1:search', ambiguity, { keep: true })
    openTab('p1:search', conflict)

    closeTabs('p1:search', [ambiguity.id, conflict.id])

    const state = useEditorTabsStore.getState()
    expect(state.groups['p1:search']).toEqual([req])
    expect(state.preview['p1:search']).toBeUndefined()
    expect(state.lastShown['p1:search']).toBeUndefined()
  })

  it('has no preview tab once the preview tab is closed', () => {
    const { openTab, closeTab } = useEditorTabsStore.getState()
    openTab('p1:search', req)

    closeTab('p1:search', req.id)

    expect(useEditorTabsStore.getState().preview['p1:search']).toBeUndefined()
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

  it('opens the page opened before the stored tabs were read in place of the stored preview tab', async () => {
    useEditorTabsStore.getState().openTab('p1:search', req)
    // Stored after the tab opened: once an earlier test has read the stored tabs, opening a tab
    // stores the tabs.
    browserStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { groups: { 'p1:search': [ambiguity, conflict] }, preview: { 'p1:search': 'i3' } },
        version: 0,
      }),
    )

    await useEditorTabsStore.persist.rehydrate()

    const state = useEditorTabsStore.getState()
    expect(state.groups['p1:search']?.map(({ id }) => id)).toEqual(['i2', 'i1'])
    expect(state.preview['p1:search']).toBe(req.id)
  })

  it('leaves a stored kept tab kept when its page opened before the stored tabs were read', async () => {
    useEditorTabsStore.getState().openTab('p1:search', req)
    // Stored after the tab opened: once an earlier test has read the stored tabs, opening a tab
    // stores the tabs.
    browserStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { groups: { 'p1:search': [req, conflict] }, preview: { 'p1:search': 'i3' } },
        version: 0,
      }),
    )

    await useEditorTabsStore.persist.rehydrate()

    const state = useEditorTabsStore.getState()
    expect(state.groups['p1:search']?.map(({ id }) => id)).toEqual(['i1', 'i3'])
    expect(state.preview['p1:search']).toBe(conflict.id)
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

  it('skips the tabs that close with it', () => {
    expect(neighborTab([req, ambiguity, conflict], req.id, [req.id, ambiguity.id])).toBe(conflict)
    expect(neighborTab([req, ambiguity, conflict], conflict.id, [ambiguity.id, conflict.id])).toBe(
      req,
    )
    expect(neighborTab([req, ambiguity], req.id, [req.id, ambiguity.id])).toBeUndefined()
  })
})
