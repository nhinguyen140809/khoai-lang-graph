import type { ReactNode } from 'react'

/** The way content moves when it is replaced: the new content comes from the opposite side. */
export type SlideDirection = 'up' | 'down' | 'left' | 'right'

/** How content goes out or comes in when it is replaced: with a short slide and a fade, or a fade alone. */
export type SwapMotion = 'slide' | 'fade'

/**
 * How old and new content share the time: `sync` crosses them at once, `wait` lets the old content
 * go out first and then brings the new content in.
 */
export type SwapMode = 'sync' | 'wait'

/** The content of a swap: the one of the current key, and the old one while it leaves. */
export interface SwapView {
  key: string | number
  node: ReactNode
  leaving: {
    key: string | number
    node: ReactNode
    direction: SlideDirection
    exit: SwapMotion
  } | null
}
