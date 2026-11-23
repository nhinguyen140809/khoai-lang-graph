'use client'

import type { RefObject } from 'react'
import { useCallback } from 'react'

import { answersOf, isChosen, isTextLine } from '../answer-review.utils'

/**
 * The focus of the steps of the answer to a review. A step takes the focus as it comes into view,
 * the first time the form shows and on every move after, so the focus never stays on what slid
 * away: a text to write takes the writer, and a step with choices takes the chosen one, or the
 * first. Give the returned ref callback to the element of the step that is shown.
 */
export function useStepFocus(form: RefObject<HTMLElement | null>) {
  return useCallback(
    (shown: HTMLElement | null) => {
      if (shown === null) return
      // The controls of a step may come a little after the step does, so a step with none yet is
      // watched until they arrive.
      const firstAnswer = () => {
        const answers = answersOf(form.current)
        return answersOf(form.current, isTextLine).at(0) ?? answers.find(isChosen) ?? answers.at(0)
      }
      const takeFocus = () => {
        const answer = firstAnswer()
        answer?.focus()
        if (answer !== undefined) watcher.disconnect()
      }
      const watcher = new MutationObserver(takeFocus)
      const frame = requestAnimationFrame(() => {
        if (firstAnswer() === undefined) watcher.observe(shown, { childList: true, subtree: true })
        else takeFocus()
      })
      return () => {
        cancelAnimationFrame(frame)
        watcher.disconnect()
      }
    },
    [form],
  )
}
