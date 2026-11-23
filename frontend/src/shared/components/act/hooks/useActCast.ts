'use client'

import { use } from 'react'

import type { ActCast } from '../act.types'
import { ActCastContext } from '../ActCastContext'

/** Who is in the act here: how a face is drawn, and the other agent of a work done by two, if any. */
export function useActCast(): ActCast {
  return use(ActCastContext)
}
