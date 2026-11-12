import type { ReactNode } from 'react'

import type { StateSize } from '../state.types'

/** The gap between items and the height of an item, in steps of the spacing scale (4 is 1rem). */
export interface LoadingMeasure {
  gap: number
  itemHeight: number
}

/** What a layout draws: how many rows, and the height of an item in steps of the spacing scale. */
export interface LoadingFit {
  rows: number
  itemHeight: number
}

/** What a layout reads to draw itself. */
export interface LayoutProps extends LoadingFit {
  columns: number
  gap: number
  /** Rows of a `lines` layout take turns at the start and at the end, as a conversation does. */
  alternate: boolean
}

/**
 * One way to shape the placeholder. The state picks a strategy by its layout and never looks into
 * it: a strategy says what it uses where the caller sets nothing, what extra height does to it
 * (more rows, or taller items), and how it draws.
 */
export interface LoadingStrategy {
  /** Whether the layout starts at the edge of its container, with none of the padding of the size. */
  isFlush: boolean
  /** The gap and the item height that it uses where the caller sets none, by size of the state. */
  measures: Record<StateSize, LoadingMeasure>
  /**
   * What fills `available` pixels of height: it adds rows, or makes the items taller, as the
   * layout does. `rows` is the number of rows asked for, which a layout that stretches keeps.
   */
  fit: (available: number, measure: LoadingMeasure, rows: number) => LoadingFit
  Layout: (props: LayoutProps) => ReactNode
}

/** How the container of the placeholder holds it. */
export type LoadingContainerKind = 'centered' | 'filling' | 'flow'
