import { cn } from 'cn'
import type * as React from 'react'

import { Spinner } from '@/shared/ui/spinner'

type NodeStatus = 'initial' | 'loading' | 'success' | 'warning' | 'error'

type NodeStatusVariant = 'overlay' | 'border'

// The ring around a node takes the -strong color of the status, which reads on the canvas.
const statusBorders = {
  success: 'border-success-strong',
  warning: 'border-warning-strong',
  error: 'border-destructive-strong',
} as const

// Covers the node with a 2px ring that sits on top of its 1px border.
const ringClass = 'pointer-events-none absolute -inset-px rounded-[calc(var(--radius-md)+1px)]'

function StatusBorder({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <>
      <div data-slot="node-status-border" className={cn(ringClass, 'border-2', className)} />
      {children}
    </>
  )
}

// While loading, a primary-colored arc turns around the node.
function BorderLoadingIndicator({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div data-slot="node-status-border" className={cn(ringClass, 'overflow-hidden')}>
        <div className="absolute top-1/2 left-1/2 aspect-square w-[140%] -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,var(--primary)_0deg,transparent_360deg)] [animation-duration:2s]" />
      </div>
      {children}
    </>
  )
}

// While loading, a blurred layer and a spinner cover the node.
function SpinnerLoadingIndicator({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <StatusBorder className="border-primary/40">{children}</StatusBorder>
      <div className="absolute inset-0 z-50 rounded-[calc(var(--radius-md)+1px)] bg-background/50 backdrop-blur-xs" />
      <div className="absolute inset-0 z-50 flex items-center justify-center">
        <span className="absolute size-10 animate-ping rounded-full bg-primary/20" />
        <Spinner color="primary" className="size-6" />
      </div>
    </div>
  )
}

/** Shows the run status of a graph node as a colored ring, or while loading as an animation. */
function NodeStatusIndicator({
  status = 'initial',
  variant = 'border',
  children,
}: {
  status?: NodeStatus
  variant?: NodeStatusVariant
  children: React.ReactNode
}) {
  switch (status) {
    case 'loading':
      return variant === 'overlay' ? (
        <SpinnerLoadingIndicator>{children}</SpinnerLoadingIndicator>
      ) : (
        <BorderLoadingIndicator>{children}</BorderLoadingIndicator>
      )
    case 'success':
    case 'warning':
    case 'error':
      return <StatusBorder className={statusBorders[status]}>{children}</StatusBorder>
    case 'initial':
      return children
  }
}

export { type NodeStatus, NodeStatusIndicator, type NodeStatusVariant }
