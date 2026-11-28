'use client'

import { type PointerEvent, useRef, useState } from 'react'

import type { AssetView } from '../asset.types'
import { turnedViewOf } from '../draw/turn.utils'

/** A press on an icon drawn as an asset, from the pointer down to the pointer up: which pointer holds it, and where it stood last. */
interface Press {
  pointerId: number
  lastX: number
  lastY: number
}

/**
 * The view of an icon drawn as an asset, which the user turns by dragging it: a drag goes into the
 * yaw along it and the pitch across it, and the icon holds the pointer for the whole drag (pointer
 * capture), so the drag keeps on when the pointer leaves the icon. The view starts at `start` and
 * can be set from elsewhere as well, as by the sliders of a card.
 */
export function useTurnableView(start: AssetView) {
  const [view, setView] = useState<AssetView>(start)
  const press = useRef<Press | null>(null)

  const endPress = () => {
    press.current = null
  }

  const dragProps = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      press.current = { pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY }
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const current = press.current
      if (current?.pointerId !== event.pointerId) return
      const dx = event.clientX - current.lastX
      const dy = event.clientY - current.lastY
      current.lastX = event.clientX
      current.lastY = event.clientY
      setView((view) => turnedViewOf(view, dx, dy))
    },
    onPointerUp: endPress,
    onPointerCancel: endPress,
  }

  return { view, setView, dragProps }
}
