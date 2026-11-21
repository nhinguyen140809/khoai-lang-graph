import { type PointerEvent, useLayoutEffect, useRef, useState } from 'react'

import { sidebarDragStart, sidebarWidths } from '../sidebar.constants'
import { useSidebarStore } from '../sidebar.store'
import type { SidebarWidths } from '../sidebar.types'
import { clampSidebarWidth, sidebarSizeAt } from '../sidebar.utils'

/** A press on the edge of the side list, from the pointer down to the pointer up. */
interface Press {
  pointerId: number
  startX: number
  /** The width of the side list as the press started: the width of its rail when it is folded. */
  startWidth: number
  /** Whether the pointer has moved far enough for the press to be a drag. */
  moved: boolean
  /** The open width shown last, which is kept once the drag ends with the side list open. */
  width: number | null
}

/**
 * The state of a side list that the user folds and resizes, and the props of its edge, the rail
 * of the sidebar of the UI kit. A click on the edge folds or opens the side list. A drag resizes
 * it between the widths of `widths`, folds it to its rail once the pointer goes nearer than
 * `foldBelow` to its left side, and opens it again when dragged back from the rail. The edge keeps
 * the pointer for the whole drag (pointer capture), so the drag holds when the pointer leaves it.
 *
 * Whether the side list is open and its width are kept in the browser, and read after the first
 * render, so the server HTML uses the defaults. The width is stored when a drag ends, not at every
 * move; while a drag of an open side list lasts, `isResizing` is true, so that the frame can stop its
 * motion and the selection of text.
 */
export function useResizableSidebar(widths: SidebarWidths = sidebarWidths) {
  const isOpen = useSidebarStore((state) => state.open)
  const storedWidth = useSidebarStore((state) => state.width)
  const setOpen = useSidebarStore((state) => state.setOpen)
  const setWidth = useSidebarStore((state) => state.setWidth)
  const [dragWidth, setDragWidth] = useState<number | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const press = useRef<Press | null>(null)
  // Set when a press ends as a drag, so that the click that follows it does not fold the side list.
  const dragged = useRef(false)

  useLayoutEffect(() => {
    // The store reads localStorage, which answers at once, so the stored width shows before paint.
    void useSidebarStore.persist.rehydrate()
  }, [])

  const endPress = (event: PointerEvent<HTMLElement>) => {
    const current = press.current
    if (current?.pointerId !== event.pointerId) return
    press.current = null
    dragged.current = current.moved
    // Folded by the drag, the side list keeps the width it had, for when it opens again.
    if (current.width !== null && useSidebarStore.getState().open) setWidth(current.width)
    setDragWidth(null)
    setIsResizing(false)
  }

  const edgeProps = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return
      // The edge sits in the box of the side list, which is as wide as the side list on show.
      const box = event.currentTarget.parentElement?.getBoundingClientRect()
      event.currentTarget.setPointerCapture(event.pointerId)
      press.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startWidth: box?.width ?? 0,
        moved: false,
        width: null,
      }
      dragged.current = false
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const current = press.current
      if (current?.pointerId !== event.pointerId) return
      const distance = event.clientX - current.startX
      if (!current.moved) {
        if (Math.abs(distance) < sidebarDragStart) return
        current.moved = true
        setIsResizing(true)
      }
      const size = sidebarSizeAt(current.startWidth + distance, widths)
      if (size.open !== useSidebarStore.getState().open) setOpen(size.open)
      if (size.open) {
        current.width = size.width
        setDragWidth(size.width)
      }
    },
    onPointerUp: endPress,
    onPointerCancel: endPress,
    onClick: () => {
      if (dragged.current) {
        dragged.current = false
        return
      }
      setOpen(!isOpen)
    },
  }

  return {
    isOpen,
    setOpen,
    /** In pixels: the width of the side list while it is open. */
    width: dragWidth ?? clampSidebarWidth(storedWidth, widths),
    // The side list that folds during a drag moves to its rail with its motion, as a click on its
    // edge does; only an open one follows the pointer without it.
    isResizing: isResizing && isOpen,
    edgeProps,
  }
}
