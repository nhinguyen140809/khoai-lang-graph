import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import type { RunDefaults } from '@/modules/run/entities'

import { useChosenRunSettingsStore } from '../chosen-run-settings.store'

const settings: RunDefaults = {
  review_checkpoints: ['checkpoint_analysis'],
  max_steps: 40,
  max_cost_usd: 1,
  parameters: null,
}

describe('useChosenRunSettingsStore', () => {
  beforeEach(() => {
    useChosenRunSettingsStore.setState({ settingsByThread: {} })
  })

  it('keeps the settings of each thread apart', () => {
    const store = useChosenRunSettingsStore.getState()

    act(() => {
      store.chooseSettings('t1', settings)
      store.chooseSettings('t2', { ...settings, max_steps: 60 })
    })

    const state = useChosenRunSettingsStore.getState()
    expect(state.settingsByThread.t1?.max_steps).toBe(40)
    expect(state.settingsByThread.t2?.max_steps).toBe(60)
  })

  it('clears the settings of one thread and keeps the others', () => {
    const store = useChosenRunSettingsStore.getState()

    act(() => {
      store.chooseSettings('t1', settings)
      store.chooseSettings('t2', settings)
      store.clearSettings('t1')
    })

    const state = useChosenRunSettingsStore.getState()
    expect(state.settingsByThread.t1).toBeUndefined()
    expect(state.settingsByThread.t2).toBeDefined()
  })
})
