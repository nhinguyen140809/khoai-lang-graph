'use client'

import { createContext, type ReactNode } from 'react'

import type { View } from './view.types'

// The pages that every view has, such as the login page, sit under no view and read this one.
export const ViewContext = createContext<View>('developer')

interface ViewProviderProps {
  children: ReactNode
  value: View
}

/**
 * Gives the pages under it their view. The layout at the root of the pages of a view states it, so
 * no component finds out which view it is in.
 */
export function ViewProvider({ children, value }: ViewProviderProps) {
  return <ViewContext value={value}>{children}</ViewContext>
}
