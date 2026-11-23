'use client'

import { use } from 'react'

import type { FaceStyleKey } from '../agent-face.types'
import { FaceStyleContext } from '../FaceStyleContext'

/** How the faces are drawn here: the way of the provider above, else the plain one. */
export function useFaceStyle(): FaceStyleKey {
  return use(FaceStyleContext)
}
