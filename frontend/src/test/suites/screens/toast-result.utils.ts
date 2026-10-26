import { expect, it, vi } from 'vitest'

import { spyOnToast } from '../../steps'
import type { ToastResultCase } from './toast-result.types'

/**
 * Tests that an action shows the toast of its result, and only that one: each case starts the
 * action, with the server refusing it or not, and reads the toast.
 */
export function itToastsOnResult(cases: readonly ToastResultCase[]) {
  it.each(cases)('shows the toast of $name', async ({ start, refuse, kind, message, options }) => {
    const toasts = { success: spyOnToast('success'), error: spyOnToast('error') }
    refuse?.()

    await start()

    await vi.waitFor(() => {
      expect(toasts[kind]).toHaveBeenCalledOnce()
    })
    expect(toasts[kind].mock.calls[0]?.[0]).toBe(message)
    if (options !== undefined) {
      expect(toasts[kind].mock.calls[0]?.[1]).toMatchObject(options)
    }
    expect(toasts[kind === 'success' ? 'error' : 'success']).not.toHaveBeenCalled()
  })
}
