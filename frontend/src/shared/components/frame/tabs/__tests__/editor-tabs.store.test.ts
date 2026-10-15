import { beforeEach, describe, expect, it } from 'vitest'

import { browserStorage } from '@/shared/lib/browser-storage.utils'

import { useEditorTabsStore } from '../editor-tabs.store'
import { neighborTab } from '../editor-tabs.utils'
import { group, neighborTabCases, storedTabsCases, tabStepsCases } from './editor-tabs.store.data'

const STORAGE_KEY = useEditorTabsStore.persist.getOptions().name ?? ''

beforeEach(() => {
  browserStorage.removeItem(STORAGE_KEY)
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
    browserStorage.setItem(STORAGE_KEY, JSON.stringify({ state: stored, version: 0 }))

    await useEditorTabsStore.persist.rehydrate()

    const state = useEditorTabsStore.getState()
    expect({ groups: state.groups, preview: state.preview }).toEqual({ groups, preview })
    expect(state).not.toHaveProperty('lastHrefs')
  })
})

describe('neighborTab', () => {
  it.each(neighborTabCases)('is $name', ({ tabs, id, closing, neighbor }) => {
    expect(neighborTab(tabs, id, closing)).toBe(neighbor)
  })
})
