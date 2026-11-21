'use client'

import { useMemo } from 'react'

import { useRegisterItem } from '@/shared/lib/registry'

import { useDeskToolStore } from '../desk-tool.store'
import type { DeskTool } from '../desk-tool.types'

/**
 * Offers a tool of the open project while the calling component is mounted, so the tool leaves
 * with the page that offers it. The desk shows it wherever its arrangement keeps the tools. The
 * tool takes its new values on each render of the caller; keep `icon` in `useMemo`.
 * @view user
 */
export function useDeskTool({ id, label, icon, isActive, onSelect, order = 0 }: DeskTool) {
  const tool = useMemo(
    () => ({ id, label, icon, isActive, onSelect, order }),
    [id, label, icon, isActive, onSelect, order],
  )
  useRegisterItem(useDeskToolStore, tool)
}
