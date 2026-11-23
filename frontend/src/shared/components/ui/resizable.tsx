'use client'

import { cn } from 'cn'
import { type ReactNode, useEffect, useEffectEvent, useState } from 'react'
import * as ResizablePrimitive from 'react-resizable-panels'

import { motionMs } from '@/shared/lib/animation'

function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        'flex h-full w-full aria-[orientation=vertical]:flex-col *:data-animated:transition-[flex-grow] *:data-animated:duration-200 *:data-animated:ease-in-out motion-reduce:*:data-animated:transition-none',
        className,
      )}
      {...props}
    />
  )
}

/**
 * A panel of the group. While `animated` is set, a change of its size made by a call such as
 * collapse or expand runs over a short time; a size that the user drags always follows the
 * pointer at once, so leave it off then.
 */
function ResizablePanel({
  animated = false,
  ...props
}: ResizablePrimitive.PanelProps & { animated?: boolean }) {
  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      data-animated={animated ? '' : undefined}
      {...props}
    />
  )
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        'group relative flex w-1.5 shrink-0 items-center justify-center bg-transparent outline-hidden transition-colors after:absolute after:inset-y-0 after:left-1/2 after:w-1.5 after:-translate-x-1/2 hover:bg-primary/40 focus-visible:bg-primary/60 aria-[orientation=horizontal]:h-1.5 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1.5 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 data-[separator=active]:bg-primary/60 [&[aria-orientation=horizontal]>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle && <div className="z-10 flex h-6 w-1 shrink-0 rounded-lg bg-border" />}
    </ResizablePrimitive.Separator>
  )
}

/** Time after the motion for the last size to arrive, before sizes count as the user's again. */
const settleMs = 50

/**
 * The motion of a panel that grows to its size when it is shown and shrinks to nothing when it is
 * hidden. `isAnimating` holds while it moves, when the sizes in between are not the size the user
 * chose; `isShrunk` holds once it has shrunk to nothing, so that what it holds can be hidden.
 */
function usePanelMotion(
  isVisible: boolean,
  restoreSize: () => number | string,
  panelRef: ReturnType<typeof ResizablePrimitive.usePanelRef>,
) {
  const [wasVisible, setWasVisible] = useState(isVisible)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isShrunk, setIsShrunk] = useState(!isVisible)

  if (isVisible !== wasVisible) {
    setWasVisible(isVisible)
    setIsAnimating(true)
    if (isVisible) setIsShrunk(false)
  }

  // What the run does to the panel reads the latest size, and does not start another run.
  const run = useEffectEvent(() => {
    if (isVisible) {
      panelRef.current?.expand()
      panelRef.current?.resize(restoreSize())
    } else {
      panelRef.current?.collapse()
    }
  })

  useEffect(() => {
    if (!isAnimating) return
    run()
    const timer = setTimeout(() => {
      setIsAnimating(false)
      if (!isVisible) setIsShrunk(true)
    }, motionMs + settleMs)
    return () => {
      clearTimeout(timer)
    }
  }, [isAnimating, isVisible])

  return { isAnimating, isShrunk }
}

interface AnimatedPanelProps {
  /** Unique among the panels of its group. */
  id: string
  /** Whether the panel is shown. Showing it grows it to its size, hiding it shrinks it to nothing. */
  isVisible: boolean
  /** The size it has when the group mounts: pixels, or a share such as `45%`. */
  defaultSize: number | string
  /** The smallest size it keeps while shown, and the largest, as `defaultSize` writes them. */
  minSize: number | string
  maxSize?: string
  /** Which side of the group the handle sits: `before` the panel, or `after` it. */
  handle: 'before' | 'after'
  /** The size the user gives it by dragging, in pixels, once the drag has settled. */
  onResize: (pixels: number) => void
  /** The user dragged it narrower than its smallest size, which hides it. */
  onCollapse: () => void
  /** What it holds. It is never unmounted, so it keeps its state while the panel is hidden. */
  children: ReactNode
}

/**
 * A panel of a group that the user shows, hides and resizes, with its handle: hiding shrinks it to
 * nothing, showing grows it back to the size it had, over a short time. It keeps its size in
 * pixels when the window is resized. Once shrunk, what it holds cannot be seen or reached with the
 * keyboard. The owner keeps the size and whether it is shown.
 */
function AnimatedResizablePanel({
  id,
  isVisible,
  defaultSize,
  minSize,
  maxSize,
  handle,
  onResize,
  onCollapse,
  children,
}: AnimatedPanelProps) {
  const panelRef = ResizablePrimitive.usePanelRef()
  // Read once: a size passed back while the user drags makes the panel register again, which ends
  // the drag after its first step.
  const [initialSize] = useState(defaultSize)
  const [size, setSize] = useState<number | string>(defaultSize)
  const { isAnimating, isShrunk } = usePanelMotion(isVisible, () => size, panelRef)

  // A panel that has shrunk to nothing has no handle at all: a handle that is only hidden can still
  // be dragged from the edge of the group, which opens the panel with nothing in it.
  const separator = isShrunk && !isAnimating ? null : <ResizableHandle />

  return (
    <>
      {handle === 'before' && separator}
      <ResizablePanel
        id={id}
        panelRef={panelRef}
        animated={isAnimating}
        // Shrunk to nothing, it cannot be dragged open from the edge of the group either.
        disabled={isShrunk && !isAnimating}
        collapsible
        collapsedSize={0}
        defaultSize={isVisible ? initialSize : 0}
        minSize={minSize}
        {...(maxSize !== undefined && { maxSize })}
        groupResizeBehavior="preserve-pixel-size"
        onResize={(next) => {
          // While it moves, the sizes in between are not the size the user chose.
          if (isAnimating || !isVisible) return
          if (next.inPixels > 0) {
            const pixels = Math.round(next.inPixels)
            setSize(pixels)
            onResize(pixels)
          } else if (panelRef.current?.isCollapsed()) onCollapse()
        }}
      >
        <div
          className="h-full"
          style={isShrunk && !isAnimating ? { visibility: 'hidden' } : undefined}
        >
          {children}
        </div>
      </ResizablePanel>
      {handle === 'after' && separator}
    </>
  )
}

export { usePanelRef } from 'react-resizable-panels'
export { AnimatedResizablePanel, ResizableHandle, ResizablePanel, ResizablePanelGroup }
