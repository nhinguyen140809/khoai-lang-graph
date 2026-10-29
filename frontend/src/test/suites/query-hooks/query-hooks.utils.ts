import { expect, it } from 'vitest'

import { renderHookWithProviders } from '../../render'
import type { DisabledHookCase } from './query-hooks.types'

/** Tests that each hook sends no request while it is not enabled. */
export function itWaitsUntilEnabled(cases: readonly DisabledHookCase[]) {
  it.each(cases)('$name waits until it is enabled', ({ useHook }) => {
    const { result } = renderHookWithProviders(useHook)

    expect(result.current.fetchStatus).toBe('idle')
  })
}
