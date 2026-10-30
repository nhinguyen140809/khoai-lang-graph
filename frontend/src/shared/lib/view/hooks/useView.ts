'use client'

import { useContext } from 'react'

import type { View } from '../view.types'
import { ViewContext } from '../ViewProvider'

/** The view that the screens show; `useWording` reads the words of a value in it. */
export function useView(): View {
  return useContext(ViewContext)
}
