'use client'

import type { RefObject } from 'react'
import { useEffect, useEffectEvent } from 'react'

import {
  answersOf,
  isChooseByEnter,
  isKeptByField,
  isSendByEnter,
  neighborOf,
  stepKeyOf,
} from '../answer-review.utils'

interface AnswerKeysOptions {
  form: RefObject<HTMLElement | null>
  step: number
  stepCount: number
  goTo: (step: number) => void
  send: () => Promise<void>
}

/**
 * The keys of the answer to a review: Left and Right go to the step before and after, Up and Down
 * move between the answers of a step, and Enter chooses the answer that has the focus or, on the
 * last step, sends. The keys leave a text box alone, where they move the caret. They come from
 * anywhere inside the form, so the form listens for them.
 */
export function useAnswerKeys({ form, step, stepCount, goTo, send }: AnswerKeysOptions) {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    // Enter chooses the answer that has the focus when it is not chosen yet; on the last step it
    // sends the answer otherwise.
    if (isChooseByEnter(event, event.target)) {
      event.preventDefault()
      ;(event.target as HTMLElement).click()
      return
    }
    if (step === stepCount - 1 && isSendByEnter(event, event.target)) {
      event.preventDefault()
      void send()
      return
    }
    const key = stepKeyOf(event)
    if (key === undefined || isKeptByField(event.target, key)) return
    event.preventDefault()
    if (key.kind === 'step') {
      goTo(step + key.by)
      return
    }
    const next = neighborOf(answersOf(form.current), event.target as HTMLElement, key.by)
    next?.focus()
    // A column of options chooses as the focus lands, as a group of radio buttons does.
    if (next?.getAttribute('role') === 'radio') next.click()
  })

  useEffect(() => {
    const element = form.current
    element?.addEventListener('keydown', onKeyDown)
    return () => {
      element?.removeEventListener('keydown', onKeyDown)
    }
  }, [form])
}
