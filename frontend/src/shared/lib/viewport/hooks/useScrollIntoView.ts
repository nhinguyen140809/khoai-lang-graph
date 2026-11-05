'use client'

import { useEffect, useEffectEvent } from 'react'

/**
 * Scrolls the element that `elementOf` gives into view once `isReady`, and again each time `key`
 * changes: `nearest` moves the scroll area only as far as it needs, `center` puts the element in
 * its middle. With `focus`, the element takes the focus too. Nothing for a null key, or when there
 * is no element. `elementOf` is read through an effect event, so a new function each render runs
 * no effect.
 */
export function useScrollIntoView(
  elementOf: () => HTMLElement | null | undefined,
  key: string | null,
  {
    block = 'nearest',
    focus = false,
    isReady = true,
  }: { block?: 'nearest' | 'center'; focus?: boolean; isReady?: boolean } = {},
): void {
  const element = useEffectEvent(elementOf)

  useEffect(() => {
    if (!isReady || key === null) return
    const target = element()
    if (target === null || target === undefined) return
    target.scrollIntoView({ block })
    if (focus) target.focus()
  }, [isReady, key, block, focus])
}
