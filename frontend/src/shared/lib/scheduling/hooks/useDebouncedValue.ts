'use client'

import { useEffect, useState } from 'react'

/**
 * The value that `value` held `waitMs` milliseconds ago without a change since: it follows `value`
 * after a pause, so that a burst of changes, such as the keys of a search, gives one new value. It
 * starts as `value`, and a change that waits is dropped when the component goes.
 */
export function useDebouncedValue<T>(value: T, waitMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value)
    }, waitMs)
    return () => {
      clearTimeout(timer)
    }
  }, [value, waitMs])

  return debounced
}
