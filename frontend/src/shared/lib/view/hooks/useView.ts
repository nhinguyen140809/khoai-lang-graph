'use client'

import { useContext } from 'react'

import type { View } from '../view.types'
import { ViewContext } from '../ViewProvider'

/** The view that the screens show, to read a wording in it: `runStatusLabels[status][view]`. */
export function useView(): View {
  return useContext(ViewContext)
}
