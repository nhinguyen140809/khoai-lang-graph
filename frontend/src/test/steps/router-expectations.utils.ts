import { expect, vi } from 'vitest'

import { routerMock } from '@/test/next-stubs'

/** Waits until the page was sent to this address with `router.push`. */
export async function expectPushedTo(href: string, ...options: unknown[]) {
  await vi.waitFor(() => {
    expect(routerMock.push).toHaveBeenCalledWith(href, ...options)
  })
}

/** Waits until the address of the page was replaced with this one by `router.replace`. */
export async function expectReplacedWith(href: string, ...options: unknown[]) {
  await vi.waitFor(() => {
    expect(routerMock.replace).toHaveBeenCalledWith(href, ...options)
  })
}
