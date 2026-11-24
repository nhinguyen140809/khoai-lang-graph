'use client'

import { createContext } from 'react'

import { AgentFace } from '@/shared/components/face'

import type { ActCast } from './act.types'

/** Who is in the act below: the face of an agent, alone, until an actor says otherwise. */
export const ActCastContext = createContext<ActCast>({ face: AgentFace, partner: undefined })
