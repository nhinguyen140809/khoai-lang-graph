'use client'

import type { ReactNode } from 'react'

import type { FaceStyleKey } from './agent-face.types'
import { FaceStyleContext } from './FaceStyleContext'

/** Says how the faces below are drawn, in the place of the plain way. */
export function FaceStyleProvider({
  style,
  children,
}: {
  style: FaceStyleKey
  children: ReactNode
}) {
  return <FaceStyleContext value={style}>{children}</FaceStyleContext>
}
