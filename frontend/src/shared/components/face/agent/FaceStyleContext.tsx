'use client'

import { createContext } from 'react'

import type { FaceStyleKey } from './agent-face.types'

/** How the faces below are drawn: plain (in CSS) until a provider says another way. */
export const FaceStyleContext = createContext<FaceStyleKey>('plain')
