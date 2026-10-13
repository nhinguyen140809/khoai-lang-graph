import { useEffect, useId } from 'react'

import { useStatusBarStore } from '../status-bar.store'
import type { StatusBarItem } from '../status-bar.types'

/**
 * Shows an item in the status bar while the calling component is mounted. A feature registers
 * what it reports, so the item leaves with the component, as a command does with `useCommands`.
 * The item takes a new `content` on each render of the caller; keep it in `useMemo` when it
 * depends on a few values only.
 */
export function useStatusBarItem({ side, order = 0, content }: StatusBarItem) {
  const source = useId()
  const setItem = useStatusBarStore((state) => state.setItem)
  const removeItem = useStatusBarStore((state) => state.removeItem)

  useEffect(() => {
    setItem(source, { side, order, content })
  }, [source, side, order, content, setItem])

  useEffect(
    () => () => {
      removeItem(source)
    },
    [source, removeItem],
  )
}
