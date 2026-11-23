'use client'

import { useReducer, useRef } from 'react'

import { applyAnswerStepsAction, initialAnswerStepsState } from '../answer-steps.reducer'
import { useAnswerKeys } from './useAnswerKeys'
import { useStepFocus } from './useStepFocus'

/**
 * The steps of the answer to a review, with the keys that move on them and the focus that each
 * step takes as it shows (see `useAnswerKeys` and `useStepFocus`).
 */
export function useAnswerSteps(stepCount: number, send: () => Promise<void>) {
  const [{ step, direction }, dispatch] = useReducer(
    applyAnswerStepsAction,
    initialAnswerStepsState,
  )
  const form = useRef<HTMLDivElement>(null)

  const goTo = (to: number) => {
    dispatch({ type: 'goTo', to, count: stepCount })
  }

  const focusStep = useStepFocus(form)
  useAnswerKeys({ form, step, stepCount, goTo, send })

  return { step, direction, goTo, form, focusStep }
}
