'use client'

import { useLayoutEffect, useRef, useState } from 'react'

import { cardGapPx, gridRowPx } from '../design-system.constants'

/**
 * Put the returned ref on the content of a grid cell: `rows` is the number of rows of the grid
 * that the content and the gap under it need, and follows the content when its height changes.
 * It is undefined until the content is measured.
 */
export function useRowSpan<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [rows, setRows] = useState<number>()

  useLayoutEffect(() => {
    const element = ref.current
    if (element === null || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      setRows(Math.ceil((element.getBoundingClientRect().height + cardGapPx) / gridRowPx))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])

  return { ref, rows }
}
