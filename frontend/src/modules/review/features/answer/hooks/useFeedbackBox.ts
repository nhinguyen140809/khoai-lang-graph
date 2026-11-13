'use client'

import { useContext } from 'react'

import { assertPresent } from '@/shared/lib/guards'

import { FeedbackBoxContext } from '../components/FeedbackBoxContext'

/** The feedback of the answer, and what changes it, from the closest provider. */
export function useFeedbackBox() {
  return assertPresent(
    useContext(FeedbackBoxContext),
    'The box of feedback of an option reads its words only inside its provider',
  )
}
