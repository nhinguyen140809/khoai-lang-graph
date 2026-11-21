'use client'

import { useRegisteredItems } from '@/shared/lib/registry'

import { useDeskToolStore } from '../desk-tool.store'

/** The tools registered with `useDeskTool`, in their order. */
export function useRegisteredDeskTools() {
  return useRegisteredItems(useDeskToolStore)
}
