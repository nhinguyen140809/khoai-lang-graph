'use client'

import { type RefCallback, useEffect, useState } from 'react'

import type { ElementSize } from '../animation.types'

interface ElementSizeResult<T extends HTMLElement> {
  /** Goes on the element to measure. */
  ref: RefCallback<T>
  /** The size of the element now; null until it has been measured once. */
  size: ElementSize | null
}

/**
 * Follows the size of an element as its content, its styles or its window change. The size is
 * null before the first measure, so a caller can leave the element to size itself until then.
 */
export function useElementSize<T extends HTMLElement>(): ElementSizeResult<T> {
  const [element, setElement] = useState<T | null>(null)
  const [size, setSize] = useState<ElementSize | null>(null)

  useEffect(() => {
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.borderBoxSize[0]
      const next = box
        ? { width: box.inlineSize, height: box.blockSize }
        : { width: element.offsetWidth, height: element.offsetHeight }
      // The same size again changes nothing, so it does not render again.
      setSize((current) =>
        current?.width === next.width && current.height === next.height ? current : next,
      )
    })
    observer.observe(element, { box: 'border-box' })
    return () => {
      observer.disconnect()
    }
  }, [element])

  return { ref: setElement, size }
}
