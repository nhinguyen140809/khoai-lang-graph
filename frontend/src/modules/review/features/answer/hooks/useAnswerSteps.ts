'use client'

import { useEffect, useEffectEvent, useReducer, useRef } from 'react'

import {
  answersOf,
  isChosen,
  isKeptByField,
  isTextLine,
  neighborOf,
  stepKeyOf,
} from '../answer-review.utils'
import { applyAnswerStepsAction, initialAnswerStepsState } from '../answer-steps.reducer'

/**
 * The steps of the answer to a review and the keys that move on them: Left and Right go to the
 * step before and after, Up and Down move between the answers of a step. The keys leave a text
 * box alone, where they move the caret. A step that the keys reach takes the focus into its first
 * answer, so the next key goes on from there.
 */
export function useAnswerSteps(stepCount: number) {
  const [{ step, direction }, dispatch] = useReducer(
    applyAnswerStepsAction,
    initialAnswerStepsState,
  )
  const form = useRef<HTMLFormElement>(null)
  const isStepping = useRef(false)

  const goTo = (to: number) => {
    dispatch({ type: 'goTo', to, count: stepCount })
  }

  // A step with a text to write puts the writer into it; a step with choices takes the focus once
  // the keys have brought the reader to it. The step is in place a frame after it is chosen, as it
  // slides in beside the one that leaves.
  useEffect(() => {
    const isFromKeys = isStepping.current
    isStepping.current = false
    const frame = requestAnimationFrame(() => {
      const text = answersOf(form.current, isTextLine).at(0)
      if (text !== undefined) {
        text.focus()
        return
      }
      if (!isFromKeys) return
      const answers = answersOf(form.current)
      const chosen = answers.find(isChosen)
      ;(chosen ?? answers.at(0))?.focus()
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [step])

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const key = stepKeyOf(event)
    if (key === undefined || isKeptByField(event.target, key)) return
    event.preventDefault()
    if (key.kind === 'step') {
      isStepping.current = true
      goTo(step + key.by)
      return
    }
    const next = neighborOf(answersOf(form.current), event.target as HTMLElement, key.by)
    next?.focus()
    // A column of options chooses as the focus lands, as a group of radio buttons does.
    if (next?.getAttribute('role') === 'radio') next.click()
  })
  // The keys come from anywhere inside the form, so the form listens for them.
  useEffect(() => {
    const element = form.current
    element?.addEventListener('keydown', onKeyDown)
    return () => {
      element?.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return { step, direction, goTo, form }
}
