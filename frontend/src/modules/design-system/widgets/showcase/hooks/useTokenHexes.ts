'use client'

import { type RefObject, useEffect, useRef, useState } from 'react'

import { toHex } from '../design-system.utils'

/**
 * The hex code of each color token, as the page shows it now, by token name. Put `probeRef` on an
 * element in the page, which is only read for its colors. The codes are read again when the theme
 * changes, since the class of the root decides which values the tokens have. Pass the same array
 * on each render, such as a constant of the module: a new array reads the codes again.
 */
export function useTokenHexes(tokens: readonly string[]): {
  hexes: Record<string, string>
  probeRef: RefObject<HTMLSpanElement | null>
} {
  const probeRef = useRef<HTMLSpanElement>(null)
  const [hexes, setHexes] = useState<Record<string, string>>({})

  useEffect(() => {
    const probe = probeRef.current
    if (probe === null) return
    const read = () => {
      const next: Record<string, string> = {}
      for (const token of tokens) {
        probe.style.backgroundColor = `var(--${token})`
        next[token] = toHex(getComputedStyle(probe).backgroundColor)
      }
      setHexes(next)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(probe.ownerDocument.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => {
      observer.disconnect()
    }
  }, [tokens])

  return { hexes, probeRef }
}
