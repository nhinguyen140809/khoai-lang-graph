import { beforeEach, describe, expect, it } from 'vitest'

import { browserStorage } from '@/shared/lib/storage'

import { tabsOf } from '../../__tests__/tab-state.utils.data'
import { useEditorTabsStore } from '../editor-tabs.store'
import { neighborTab } from '../editor-tabs.utils'
import {
  ambiguity,
  conflict,
  group,
  neighborTabCases,
  otherGroup,
  requirement,
  storedTabsCases,
  tabStepsCases,
} from './editor-tabs.store.data'

const STORAGE_KEY = useEditorTabsStore.persist.getOptions().name ?? ''

/** The key of the stored tabs of `tabGroup`. */
function keyOf(tabGroup: string) {
  return `${STORAGE_KEY}:${tabGroup}`
}

/** What the storage holds for `tabGroup`, as another browser tab would read it. */
function storedGroup(tabGroup: string): unknown {
  const stored = browserStorage.getItem(keyOf(tabGroup))
  return stored === null ? null : JSON.parse(stored)
}

beforeEach(() => {
  useEditorTabsStore.persist.clearStorage()
})

describe('useEditorTabsStore', () => {
  it.each(tabStepsCases)('$name', ({ steps, tabs, preview, onScreen, lastShown, keepNext }) => {
    for (const step of steps) step(useEditorTabsStore.getState())

    const state = useEditorTabsStore.getState()
    expect({
      ...tabsOf(group),
      keepNext: state.pendingOpen?.keep === true ? state.pendingOpen.href : null,
    }).toEqual({ tabs, preview, onScreen, lastShown, keepNext })
  })

  it('keeps no title for a page whose tab is open already', () => {
    useEditorTabsStore.getState().openTab(group, requirement)

    useEditorTabsStore.getState().namePage(requirement.href, 'Find a mentor')

    expect(useEditorTabsStore.getState().pendingOpen).toBeNull()
  })

  it('keeps the title for a page whose tab is not open', () => {
    useEditorTabsStore.getState().namePage(requirement.href, 'Find a mentor')

    expect(useEditorTabsStore.getState().pendingOpen).toEqual({
      href: requirement.href,
      keep: false,
      replaceTabId: null,
      title: 'Find a mentor',
    })
  })

  it('meets a page and an address of it that has a query at the path', () => {
    const state = useEditorTabsStore.getState()

    // Kept before its tab opens: the address of an item read in its document carries a query.
    state.keepPage(`${requirement.href}?item=i9`)
    expect(useEditorTabsStore.getState().pendingOpen).toMatchObject({
      href: requirement.href,
      keep: true,
    })

    useEditorTabsStore.getState().openTab(group, requirement)
    expect(useEditorTabsStore.getState().preview[group]).toBeUndefined()

    // Kept after its tab opened as a preview: the query does not hide the tab.
    useEditorTabsStore.getState().openTab(group, ambiguity)
    expect(useEditorTabsStore.getState().preview[group]).toBe(ambiguity.id)
    useEditorTabsStore.getState().keepPage(`${ambiguity.href}?item=i9`)
    expect(useEditorTabsStore.getState().preview[group]).toBeUndefined()
  })

  it.each(storedTabsCases)('reads $name', async ({ stored, groups, preview }) => {
    for (const [tabGroup, tabs] of Object.entries(stored)) {
      browserStorage.setItem(keyOf(tabGroup), JSON.stringify(tabs))
    }

    await useEditorTabsStore.persist.rehydrate()

    const state = useEditorTabsStore.getState()
    expect({ groups: state.groups, preview: state.preview }).toEqual({ groups, preview })
  })

  it('keeps the tabs that another browser tab opened in another group since it read them', async () => {
    browserStorage.setItem(keyOf(group), JSON.stringify({ tabs: [requirement] }))
    browserStorage.setItem(keyOf(otherGroup), JSON.stringify({ tabs: [conflict] }))
    await useEditorTabsStore.persist.rehydrate()
    // Another browser tab opens a tab in the other group.
    browserStorage.setItem(keyOf(otherGroup), JSON.stringify({ tabs: [conflict, ambiguity] }))

    useEditorTabsStore.getState().openTab(group, ambiguity)
    useEditorTabsStore.getState().closeTabs(group, [requirement.id])

    expect(storedGroup(group)).toEqual({ tabs: [ambiguity], preview: ambiguity.id })
    expect(storedGroup(otherGroup)).toEqual({ tabs: [conflict, ambiguity] })
  })

  it('removes the stored tabs of a group once all of them close', async () => {
    await useEditorTabsStore.persist.rehydrate()
    useEditorTabsStore.getState().openTab(group, requirement)
    expect(storedGroup(group)).toEqual({ tabs: [requirement], preview: requirement.id })

    useEditorTabsStore.getState().closeTabs(group, [requirement.id])

    expect(storedGroup(group)).toBeNull()
  })
})

describe('neighborTab', () => {
  it.each(neighborTabCases)('is $name', ({ tabs, id, closing, neighbor }) => {
    expect(neighborTab(tabs, id, closing)).toBe(neighbor)
  })
})
