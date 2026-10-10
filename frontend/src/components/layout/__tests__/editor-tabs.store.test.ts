import { beforeEach, describe, expect, it } from 'vitest'

import { browserStorage } from '@/lib/browser-storage.utils'

import { neighborTab, useEditorTabsStore } from '../editor-tabs.store'

const STORAGE_KEY = 'khoailanggraph-editor-tabs'
const main = { id: 't1', title: 'Main thread', href: '/projects/p1/chat/t1' }
const booking = { id: 't2', title: 'Booking rules', href: '/projects/p1/chat/t2' }
const rules = { id: 't3', title: 'Rules', href: '/projects/p1/chat/t3', icon: 'thread' as const }

beforeEach(() => {
  browserStorage.removeItem(STORAGE_KEY)
  useEditorTabsStore.setState({ groups: {}, lastHrefs: {} })
})

describe('useEditorTabsStore', () => {
  it('opens a tab once and updates its title', () => {
    const { openTab } = useEditorTabsStore.getState()

    openTab('p1:chat', main)
    openTab('p1:chat', booking)
    openTab('p1:chat', { ...main, title: 'Renamed' })

    expect(useEditorTabsStore.getState().groups['p1:chat']).toEqual([
      { ...main, title: 'Renamed' },
      booking,
    ])
  })

  it('opens a new tab next to the tab of the page shown before', () => {
    const { openTab } = useEditorTabsStore.getState()
    openTab('p1:chat', main)
    openTab('p1:chat', booking)

    openTab('p1:chat', rules, { after: main.href })

    expect(useEditorTabsStore.getState().groups['p1:chat']?.map(({ id }) => id)).toEqual([
      't1',
      't3',
      't2',
    ])
  })

  it('forgets the last address of a group when its tab closes', () => {
    const { openTab, setLastHref, closeTab } = useEditorTabsStore.getState()
    openTab('p1:chat', main)
    setLastHref('p1:chat', main.href)

    closeTab('p1:chat', main.id)

    expect(useEditorTabsStore.getState().groups['p1:chat']).toEqual([])
    expect(useEditorTabsStore.getState().lastHrefs['p1:chat']).toBeUndefined()
  })

  it('keeps tabs opened before the stored tabs were read', async () => {
    browserStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { groups: { 'p1:chat': [booking] }, lastHrefs: {} }, version: 0 }),
    )
    useEditorTabsStore.getState().openTab('p1:chat', main)

    await useEditorTabsStore.persist.rehydrate()

    expect(useEditorTabsStore.getState().groups['p1:chat']).toEqual([booking, main])
  })

  it('drops stored tabs that do not have the expected shape', async () => {
    browserStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { groups: { 'p1:chat': [{ id: 1 }] }, lastHrefs: {} }, version: 0 }),
    )

    await useEditorTabsStore.persist.rehydrate()

    expect(useEditorTabsStore.getState().groups).toEqual({})
  })
})

describe('neighborTab', () => {
  it('is the next tab, else the previous one', () => {
    expect(neighborTab([main, booking], main.id)).toBe(booking)
    expect(neighborTab([main, booking], booking.id)).toBe(main)
    expect(neighborTab([main], main.id)).toBeUndefined()
  })
})
