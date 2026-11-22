'use client'

import {
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import { hasText } from '@/shared/lib/guards'

import { promptInputLooks, type PromptInputSize } from './prompt-input.types'
import {
  PromptFieldContext,
  PromptLooksContext,
  PromptSubmitContext,
  PromptTextContext,
} from './PromptInputContext'

interface PromptInputProps {
  /** The id of the element that names the prompt, such as a heading above it. */
  labelledBy?: string | undefined
  /** The name of the prompt for assistive technology when nothing on screen names it. */
  label?: string | undefined
  value: string
  onValueChange: (value: string) => void
  /** Sends the text, trimmed; never called with a blank text or while `isPending`. */
  onSubmit: (text: string) => void
  /** The keys, read by assistive technology only, such as "Enter to send, Shift+Enter for a new line". */
  keysHint: string
  /** While the text is sent: the send button is disabled and spins. */
  isPending?: boolean | undefined
  /**
   * Three rows for a prompt that starts a project, one row that grows for the chat, and a slim
   * one whose send sits in the row of the text, for the place a review already fills.
   */
  size?: PromptInputSize | undefined
  inputRef?: Ref<HTMLTextAreaElement> | undefined
  /** The parts of the prompt: a `PromptBox` and, under it, a `PromptFooter`. */
  children: ReactNode
}

/**
 * The prompt that starts work. It holds what its parts share, the text, how it is sent and how it
 * looks, and the parts draw it: a `PromptBox` with its `PromptTextarea` and, under it, a
 * `PromptFooter`. What a place adds, a menu or a button, is one more part put where it belongs, so
 * that nothing between the place and the prompt has to be told of it. What the parts share is held in
 * four contexts, one for each thing that changes together, so that a part is drawn again only for
 * what it reads. Enter sends, Shift+Enter
 * adds a line.
 */
export function PromptInput({
  labelledBy,
  label,
  value,
  onValueChange,
  onSubmit,
  keysHint,
  isPending = false,
  size = 'comfortable',
  inputRef,
  children,
}: PromptInputProps) {
  const keysId = `${useId()}-keys`
  const isBlank = !hasText(value)
  const [beforeSubmit] = useState(() => new Set<() => void>())

  const addBeforeSubmit = useCallback(
    (run: () => void) => {
      beforeSubmit.add(run)
      return () => {
        beforeSubmit.delete(run)
      }
    },
    [beforeSubmit],
  )

  // What a send reads is kept in a ref, so that `submit` is the same function from one render to
  // the next and the parts that hold it are not drawn again for it.
  const latest = useRef({ value, isBlank, isPending, onSubmit })
  useEffect(() => {
    latest.current = { value, isBlank, isPending, onSubmit }
  })
  const submit = useCallback(() => {
    const current = latest.current
    if (current.isBlank || current.isPending) return
    for (const run of beforeSubmit) run()
    current.onSubmit(current.value.trim())
  }, [beforeSubmit])

  const canSubmit = !isBlank && !isPending

  // Each context holds only what changes together, so that a part is drawn again only for what it reads.
  const looks = useMemo(() => ({ size, looks: promptInputLooks[size] }), [size])
  const text = useMemo(() => ({ value, onValueChange }), [value, onValueChange])
  const submitting = useMemo(
    () => ({ submit, canSubmit, isPending, addBeforeSubmit }),
    [submit, canSubmit, isPending, addBeforeSubmit],
  )
  const field = useMemo(
    () => ({ labelledBy, label, keysId, inputRef }),
    [labelledBy, label, keysId, inputRef],
  )

  return (
    <PromptLooksContext value={looks}>
      <PromptTextContext value={text}>
        <PromptSubmitContext value={submitting}>
          <PromptFieldContext value={field}>
            <form
              aria-labelledby={labelledBy}
              aria-label={label}
              onSubmit={(event) => {
                event.preventDefault()
                submit()
              }}
              className="flex flex-col gap-0"
            >
              {/* Only assistive technology reads the keys; on screen, the arrow sends the text. */}
              <p id={keysId} className="sr-only">
                {keysHint}
              </p>
              {children}
            </form>
          </PromptFieldContext>
        </PromptSubmitContext>
      </PromptTextContext>
    </PromptLooksContext>
  )
}
