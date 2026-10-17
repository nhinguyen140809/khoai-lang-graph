'use client'

import { createContext, useContext } from 'react'

import type { View } from '@/shared/domain/view'

/**
 * The view of the app that the screens show, which the root of the app provides. Without a
 * provider, as in a test, it is the user view.
 */
export const ViewContext = createContext<View>('user')

/** The view that the screens show, to read a wording in it: `runStatusLabels[status][view]`. */
export function useView(): View {
  return useContext(ViewContext)
}
