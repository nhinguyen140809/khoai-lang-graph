'use client'

import { cn } from 'cn'
import { useEffect, useId, useRef } from 'react'

import type { InterruptOption } from '@/modules/review/entities'
import { Textarea } from '@/shared/components/ui/textarea'

import { answerReviewMessages as words } from '../../answer-review.constants'
import { useFeedbackBox } from '../../hooks/useFeedbackBox'

/** How an option of the answer shows, by whether the user chose it. */
const optionLooks = {
  idle: 'border-border hover:bg-muted/40',
  chosen: 'border-primary ring-half-primary',
} as const satisfies Record<'idle' | 'chosen', string>

/** How the dot of an option of the answer shows, by the same state. */
const optionDotLooks = {
  idle: 'border-muted-foreground/40',
  chosen: 'border-primary bg-primary',
} as const satisfies Record<'idle' | 'chosen', string>

/** The options of the answer in one column: the one that is chosen opens its box inside it. */
export function OptionsColumn({
  options,
  chosen,
  onSelect,
}: {
  options: readonly InterruptOption[]
  chosen: string | null
  onSelect: (option: InterruptOption) => void
}) {
  return (
    <div role="radiogroup" aria-label={words.choice} className="flex flex-col gap-1">
      {options.map((option) => (
        <OptionRow
          key={option.key}
          option={option}
          isChosen={chosen === option.key}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

/**
 * One option of the answer: its title, then the description of what choosing it does, which shows
 * for every option. An option that asks for words and has no description says that, while it is
 * not chosen.
 */
function OptionRow({
  option,
  isChosen,
  onSelect,
}: {
  option: InterruptOption
  isChosen: boolean
  onSelect: (option: InterruptOption) => void
}) {
  const state = isChosen ? 'chosen' : 'idle'
  const descriptionId = useId()

  return (
    // The focus shows as a ring whatever took it: a script that moves it after a click is no key
    // press, so `focus-visible` would leave the focused option with no sign.
    <div
      className={cn(
        'rounded-lg border has-[>button:focus]:border-ring has-[>button:focus]:ring-3 has-[>button:focus]:ring-ring/50',
        optionLooks[state],
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={isChosen}
        {...(option.description !== undefined && { 'aria-describedby': descriptionId })}
        className={cn(
          'flex w-full items-center gap-2 p-2 text-left outline-none',
          (option.requires_feedback || option.description !== undefined) && 'pb-1',
        )}
        onClick={() => {
          onSelect(option)
        }}
      >
        <span
          aria-hidden
          className={cn('size-3.5 shrink-0 rounded-full border-2', optionDotLooks[state])}
        />
        <span className="text-sm font-medium">{option.label}</span>
      </button>
      {option.description !== undefined && (
        <p
          id={descriptionId}
          className={cn('pl-8 text-sm text-muted-foreground', !option.requires_feedback && 'pb-2')}
        >
          {option.description}
        </p>
      )}
      <OptionFeedback option={option} isChosen={isChosen} />
    </div>
  )
}

/**
 * What an option that asks for words shows under its title: its box once it is chosen, where the
 * writer lands at once, and, while it is not chosen and has no description, a line that says it asks.
 */
function OptionFeedback({ option, isChosen }: { option: InterruptOption; isChosen: boolean }) {
  const { feedback, onFeedback, onFeedbackKey } = useFeedbackBox()
  const box = useRef<HTMLTextAreaElement | null>(null)
  // Choosing the option puts the writer straight into the box.
  useEffect(() => {
    if (isChosen) box.current?.focus()
  }, [isChosen])

  if (!option.requires_feedback) return null
  if (!isChosen) {
    if (option.description !== undefined) return null
    return <p className="pb-2 pl-8 text-sm text-muted-foreground">{words.asksForDescription}</p>
  }
  return (
    <div className="px-2 pt-1 pb-2">
      <Textarea
        ref={box}
        rows={2}
        aria-label={words.feedbackFor(option.label)}
        placeholder={words.feedbackPlaceholder}
        value={feedback}
        onChange={(event) => {
          onFeedback(event.target.value)
        }}
        onKeyDown={onFeedbackKey}
        className="min-h-0 px-2 py-1 text-xs focus-visible:ring-0 md:text-xs"
      />
    </div>
  )
}
