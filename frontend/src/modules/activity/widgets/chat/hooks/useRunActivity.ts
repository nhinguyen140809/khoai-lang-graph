'use client'

import { useContext } from 'react'

import { assertPresent } from '@/shared/lib/guards'

import { RunActivityContext } from '../components/RunActivityContext'

/** What every entry of the run of the closest provider holds. */
export function useRunActivity() {
  return assertPresent(
    useContext(RunActivityContext),
    'The entries of a run of the chat read their run only inside its provider',
  )
}
