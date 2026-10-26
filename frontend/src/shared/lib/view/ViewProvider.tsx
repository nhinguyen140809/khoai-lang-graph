'use client'

import { createContext, type ReactNode } from 'react'

import type { View } from './view.types'

export const ViewContext = createContext<View>('user')

interface ViewProviderProps {
  children: ReactNode
  value?: View
}

/** Provides the wording view for an application subtree. */
export function ViewProvider({ children, value = 'user' }: ViewProviderProps) {
  return <ViewContext value={value}>{children}</ViewContext>
}
