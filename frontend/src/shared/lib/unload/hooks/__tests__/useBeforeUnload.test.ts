import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useBeforeUnload } from '../useBeforeUnload'

/** Whether the page asks before it is left: what the browser reads of the event it sends. */
function isAskingBeforeLeaving() {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event.defaultPrevented
}

describe('useBeforeUnload', () => {
  it('asks while it is told to, and stops asking when it is not, or when the page goes', () => {
    const view = renderHook(
      ({ isEnabled }) => {
        useBeforeUnload(isEnabled)
      },
      { initialProps: { isEnabled: true } },
    )
    expect(isAskingBeforeLeaving()).toBe(true)

    view.rerender({ isEnabled: false })
    expect(isAskingBeforeLeaving()).toBe(false)

    view.rerender({ isEnabled: true })
    view.unmount()
    expect(isAskingBeforeLeaving()).toBe(false)
  })
})
