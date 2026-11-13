import type { ReactNode, Ref } from 'react'

import { cn } from '@/shared/lib/cn'

import { CenteredState } from '../CenteredState'
import type { LoadingContainerKind } from './loading.types'

/** What a container reads to hold the placeholder. */
export interface LoadingContainerProps {
  label: string
  className: string | undefined
  /** The classes of the padding of the size, which a layout that starts at the edge does not take. */
  paddingClassName: string
  isNarrow: boolean
  /** Reads the height of the container, for the layout that fills it. */
  containerRef: Ref<HTMLDivElement>
  children: ReactNode
}

const statusProps = (label: string) => ({
  role: 'status',
  'aria-busy': true,
  'aria-label': label,
})

function Column({ isNarrow, children }: Pick<LoadingContainerProps, 'isNarrow' | 'children'>) {
  return <div className={cn('w-full', isNarrow && 'mx-auto max-w-md')}>{children}</div>
}

/** In the middle of the container, in a narrow column. */
function CenteredContainer({ label, className, children }: LoadingContainerProps) {
  return (
    <CenteredState {...statusProps(label)} className={className}>
      <div className="flex w-full max-w-md flex-col">{children}</div>
    </CenteredState>
  )
}

/**
 * Drawn over the container and clipped to it, so that the rows it holds never change the height
 * that decides how many rows there are.
 */
function FillingContainer({
  label,
  className,
  paddingClassName,
  isNarrow,
  containerRef,
  children,
}: LoadingContainerProps) {
  return (
    <div
      ref={containerRef}
      {...statusProps(label)}
      className={cn('relative h-full min-h-48 w-full', className)}
    >
      <div className={cn('absolute inset-0 overflow-hidden', paddingClassName)}>
        <Column isNarrow={isNarrow}>{children}</Column>
      </div>
    </div>
  )
}

/** In the flow of the page, as tall as the rows it holds. */
function FlowContainer({
  label,
  className,
  paddingClassName,
  isNarrow,
  children,
}: LoadingContainerProps) {
  return (
    <div
      {...statusProps(label)}
      className={cn('flex w-full flex-col', paddingClassName, className)}
    >
      <Column isNarrow={isNarrow}>{children}</Column>
    </div>
  )
}

/** The container of each kind: a new kind is one more entry. */
export const loadingContainers = {
  centered: CenteredContainer,
  filling: FillingContainer,
  flow: FlowContainer,
} satisfies Record<LoadingContainerKind, (props: LoadingContainerProps) => ReactNode>
