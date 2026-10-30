'use client'

import type { Wording } from '../view.types'
import { useView } from './useView'

/** The words of a value in the view of the app, such as `useWording(runStatusLabel(status))`. */
export function useWording(wording: Wording): string {
  return wording[useView()]
}
