'use client'

import { type ColorMode, type Edge, type Node, ReactFlow, type ReactFlowProps } from '@xyflow/react'
import { cn } from 'cn'
import { useTheme } from 'next-themes'
import { useId } from 'react'

import { useIsHydrated } from '@/hooks/useIsHydrated'

/**
 * A React Flow canvas in the colors of the design system. The colors come from the --xy-*
 * variables in styles.css; the color mode follows the theme for anything they leave out.
 */
function Flow<NodeType extends Node = Node, EdgeType extends Edge = Edge>({
  id,
  className,
  ...props
}: ReactFlowProps<NodeType, EdgeType>) {
  // React Flow builds the ids of its accessibility descriptions from `id`, so two canvases on
  // one page need different ones.
  const generatedId = useId()
  const { resolvedTheme } = useTheme()
  // The theme is only known in the browser, so the server and the first client render use the
  // light mode, and the canvas switches to the theme after hydration.
  const hydrated = useIsHydrated()
  const colorMode: ColorMode = hydrated && resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <ReactFlow<NodeType, EdgeType>
      data-slot="flow"
      id={id ?? generatedId}
      colorMode={colorMode}
      className={cn('text-xs', className)}
      {...props}
    />
  )
}

export { Flow }
