'use client'

import { type KeyboardEvent, useRef } from 'react'

import { cn } from '@/shared/lib/utils'

interface Choice {
  key: string
  label: string
}

interface ChoiceListProps {
  /** Names the list for assistive technology. */
  label: string
  choices: Choice[]
  /** The keys of the chosen ones; at most one for a list of options. */
  value: string[]
  /** More than one can be chosen. */
  multiple?: boolean
  onChange: (value: string[]) => void
}

/**
 * A numbered list of choices: `1. Accept`, with a `>` at the chosen one, or `[x]` for each of
 * several. The arrow keys move the choice and a number chooses it.
 */
export function ChoiceList({ label, choices, value, multiple = false, onChange }: ChoiceListProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const focusable = Math.max(
    0,
    choices.findIndex(({ key }) => value.includes(key)),
  )

  const toggle = (key: string) => {
    if (!multiple) onChange([key])
    else onChange(value.includes(key) ? value.filter((entry) => entry !== key) : [...value, key])
  }

  const move = (from: number, step: number) => {
    const next = (from + step + choices.length) % choices.length
    refs.current[next]?.focus()
    const choice = choices[next]
    if (choice !== undefined && !multiple) onChange([choice.key])
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      move(index, 1)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      move(index, -1)
    } else if (/^[1-9]$/.test(event.key)) {
      const choice = choices[Number(event.key) - 1]
      if (choice !== undefined) {
        event.preventDefault()
        refs.current[Number(event.key) - 1]?.focus()
        if (multiple) toggle(choice.key)
        else onChange([choice.key])
      }
    }
  }

  return (
    <div
      role={multiple ? 'group' : 'radiogroup'}
      aria-label={multiple ? `${label} (choose any)` : label}
      className="flex flex-col font-mono text-xs"
    >
      {choices.map((choice, index) => {
        const chosen = value.includes(choice.key)
        return (
          <button
            key={choice.key}
            ref={(element) => {
              refs.current[index] = element
            }}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={chosen}
            tabIndex={multiple || index === focusable ? 0 : -1}
            onClick={() => {
              toggle(choice.key)
            }}
            onKeyDown={(event) => {
              handleKeyDown(event, index)
            }}
            className={cn(
              'flex gap-2 rounded-sm px-1 py-0.5 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50',
              chosen && 'text-foreground',
              !chosen && 'text-muted-foreground',
            )}
          >
            <span aria-hidden className="w-6 shrink-0">
              {multiple ? (chosen ? '[x]' : '[ ]') : chosen ? '>' : ''}
            </span>
            <span>
              {String(index + 1)}. {choice.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
