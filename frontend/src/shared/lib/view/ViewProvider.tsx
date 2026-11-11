'use client'

import { createContext, type ReactNode } from 'react'

import type { View } from './view.types'

// The pages that every view has, such as the login page, sit under no view and read this one.
export const ViewContext = createContext<View>('developer')

interface ViewProviderProps {
  children: ReactNode
  value?: View
}

/** Provides the wording view for an application subtree. */
export function ViewProvider({ children, value = 'developer' }: ViewProviderProps) {
  return <ViewContext value={value}>{children}</ViewContext>
}
