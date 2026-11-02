'use client'

import { useId, useLayoutEffect } from 'react'

import type { RegistryStore } from '../registry.types'

/**
 * Registers `item` in the registry while the calling component is mounted, so that the item
 * leaves with the component, as a command does with `useCommands`. `item` takes effect each time
 * it changes: keep it in `useMemo` when the caller builds it on every render.
 */
export function useRegisterItem<Item>(store: RegistryStore<Item>, item: Item) {
  const source = useId()
  const setItem = store((state) => state.setItem)
  const removeItem = store((state) => state.removeItem)

  // Before the screen is painted, so that what the item adds is there on the first frame.
  useLayoutEffect(() => {
    setItem(source, item)
  }, [source, item, setItem])

  useLayoutEffect(
    () => () => {
      removeItem(source)
    },
    [source, removeItem],
  )
}
