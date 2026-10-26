import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PanelRegion } from '../../panel.types'
import { usePanelsStore } from '../../panels.store'
import { usePanel } from '../usePanel'
import { defaultSizeCases, visibilityCases } from './usePanel.data'

describe('usePanel', () => {
  it('is not restored until the stored sizes are read, then is', async () => {
    const { result } = renderHook(() => usePanel(PanelRegion.Side))
    expect(result.current.restored).toBe(false)

    await act(async () => {
      await usePanelsStore.persist.rehydrate()
    })

    expect(result.current.restored).toBe(true)
  })

  it.each(visibilityCases)('$name', ({ region, visibleBefore, change, visible }) => {
    usePanelsStore.setState((state) => ({
      panels: { ...state.panels, [region]: { ...state.panels[region], visible: visibleBefore } },
    }))
    const { result } = renderHook(() => usePanel(region))

    act(() => {
      change(result.current)
    })

    expect(result.current.visible).toBe(visible)
  })

  it.each(defaultSizeCases)('reads the size of $name without following it', ({ region, size }) => {
    const { result } = renderHook(() => usePanel(region))
    expect(result.current.storedSize()).toBe(size)

    act(() => {
      result.current.resize(size + 40)
    })

    expect(result.current.storedSize()).toBe(size + 40)
  })

  it('changes only the panel of its region', () => {
    const { result } = renderHook(() => usePanel(PanelRegion.Side))

    act(() => {
      result.current.toggle()
    })

    expect(usePanelsStore.getState().panels[PanelRegion.Bottom].visible).toBe(true)
  })
})
