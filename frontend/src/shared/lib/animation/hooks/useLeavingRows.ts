'use client'

import { useEffect, useState } from 'react'

import { motionMs } from '../animation.constants'

/** A row of the list, and whether it is on its way out. */
export interface LeavingRow<T> {
  row: T
  isLeaving: boolean
}

interface Leaving<T> {
  row: T
  /** The key of the row before it that stayed, so that it leaves where it stood; null for the top. */
  after: string | null
}

interface RowsState<T> {
  signature: string
  shown: T[]
  leaving: Leaving<T>[]
}

/**
 * The rows of a list, with the rows that have just gone from it kept in their place for `ms`
 * milliseconds and marked `isLeaving`, so that the part that draws them can play an exit before
 * they are removed. A row that comes back in that time is a row again. The first render has no
 * leaving rows. A leaving row is the row it was: what it reads may no longer be there, so the
 * part that draws it should read only what it has kept.
 */
export function useLeavingRows<T>(
  rows: T[],
  getKey: (row: T) => string,
  ms: number = motionMs,
): LeavingRow<T>[] {
  const signature = rows.map(getKey).join('\u0000')
  const [state, setState] = useState<RowsState<T>>({ signature, shown: rows, leaving: [] })

  if (state.signature !== signature) {
    const stays = new Set(rows.map(getKey))
    const gone = state.shown.flatMap((row, index) => {
      if (stays.has(getKey(row))) return []
      const before = state.shown.slice(0, index).findLast((other) => stays.has(getKey(other)))
      return [{ row, after: before === undefined ? null : getKey(before) }]
    })
    const kept = state.leaving.filter((entry) => !stays.has(getKey(entry.row)))
    setState({ signature, shown: rows, leaving: [...kept, ...gone] })
  }

  const leaving = state.leaving
  useEffect(() => {
    if (leaving.length === 0) return
    const timer = setTimeout(() => {
      setState((current) => (current.leaving === leaving ? { ...current, leaving: [] } : current))
    }, ms)
    return () => {
      clearTimeout(timer)
    }
  }, [leaving, ms])

  if (leaving.length === 0) return rows.map((row) => ({ row, isLeaving: false }))

  const after = (key: string | null) =>
    leaving
      .filter((entry) => entry.after === key)
      .map((entry) => ({ row: entry.row, isLeaving: true }))
  return [
    ...after(null),
    ...rows.flatMap((row) => [{ row, isLeaving: false }, ...after(getKey(row))]),
  ]
}
