'use client'

import { useMemo } from 'react'

import type { ChainGraph } from '@/modules/trace/entities'

import type { ChainPositions } from '../item-trace.types'
import { chainColumnsOf } from '../item-trace.utils'

/** The columns of the chain, worked out again only when its nodes or their places change. */
export function useChainColumns(graph: ChainGraph, positions: ChainPositions) {
  return useMemo(() => chainColumnsOf(graph.nodes, positions), [graph.nodes, positions])
}
