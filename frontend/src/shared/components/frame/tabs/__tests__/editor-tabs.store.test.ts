import { beforeEach, describe, expect, it } from 'vitest'

import { browserStorage } from '@/shared/lib/storage/browser-storage.utils'

import { useEditorTabsStore } from '../editor-tabs.store'
import { neighborTab } from '../editor-tabs.utils'
import {
  ambiguity,
  conflict,
  group,
  neighborTabCases,
  otherGroup,
  req,
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
  useEditorTabsStore.setState(useEditorTabsStore.getInitialState())
})

describe('useEditorTabsStore', () => {
  it.each(tabStepsCases)('$name', ({ steps, tabs, preview, onScreen, lastShown, keepNext }) => {
    for (const step of steps) step(useEditorTabsStore.getState())

    const state = useEditorTabsStore.getState()
    expect({
      tabs: state.groups[group] ?? [],
      preview: state.preview[group] ?? null,
      onScreen: state.onScreen[group] ?? null,
      lastShown: state.lastShown[group] ?? null,
      keepNext: state.keepNext,
    }).toEqual({ tabs, preview, onScreen, lastShown, keepNext })
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
    browserStorage.setItem(keyOf(group), JSON.stringify({ tabs: [req] }))
    browserStorage.setItem(keyOf(otherGroup), JSON.stringify({ tabs: [conflict] }))
    await useEditorTabsStore.persist.rehydrate()
    // Another browser tab opens a tab in the other group.
    browserStorage.setItem(keyOf(otherGroup), JSON.stringify({ tabs: [conflict, ambiguity] }))

    useEditorTabsStore.getState().openTab(group, ambiguity)
    useEditorTabsStore.getState().closeTabs(group, [req.id])

    expect(storedGroup(group)).toEqual({ tabs: [ambiguity], preview: ambiguity.id })
    expect(storedGroup(otherGroup)).toEqual({ tabs: [conflict, ambiguity] })
  })

  it('removes the stored tabs of a group once all of them close', async () => {
    await useEditorTabsStore.persist.rehydrate()
    useEditorTabsStore.getState().openTab(group, req)
    expect(storedGroup(group)).toEqual({ tabs: [req], preview: req.id })

    useEditorTabsStore.getState().closeTabs(group, [req.id])

    expect(storedGroup(group)).toBeNull()
  })
})

describe('neighborTab', () => {
  it.each(neighborTabCases)('is $name', ({ tabs, id, closing, neighbor }) => {
    expect(neighborTab(tabs, id, closing)).toBe(neighbor)
  })
})
