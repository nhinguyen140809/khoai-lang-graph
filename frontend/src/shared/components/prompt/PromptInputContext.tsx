'use client'

import { createContext, type Ref } from 'react'

import type { promptInputLooks, PromptInputSize } from './prompt-input.types'

// What the parts of a prompt share is held in four contexts, each for what changes together, so that
// a part that reads one is not drawn again when another changes: the text changes with every key,
// the way to send changes when the text goes from blank to not blank, and the look and the names of
// the fields hardly change at all.

/** How the size of the prompt shows its parts. It changes only with the size. */
export interface PromptLooksValue {
  size: PromptInputSize
  looks: (typeof promptInputLooks)[keyof typeof promptInputLooks]
}

/** The text of the prompt. It changes with every key. */
export interface PromptTextValue {
  value: string
  onValueChange: (value: string) => void
}

/** How the text is sent. It changes when the text goes from blank to not blank, and while it is sent. */
export interface PromptSubmitValue {
  /** Sends the text if it can be sent; the same function for the life of the prompt. */
  submit: () => void
  /** Whether the text can be sent: it is not blank and it is not being sent. */
  canSubmit: boolean
  /** Whether the text is being sent. */
  isPending: boolean
  /**
   * Asks `run` to be called just before the text is sent, such as to end a dictation. It gives back
   * what takes it away again.
   */
  addBeforeSubmit: (run: () => void) => () => void
}

/** What names the field of the prompt and holds its element. It changes only with its props. */
export interface PromptFieldValue {
  /** The id of the element that names the prompt, if one does. */
  labelledBy: string | undefined
  /** The name of the prompt for assistive technology when nothing on screen names it. */
  label: string | undefined
  /** The id of the keys hint that the text is described by. */
  keysId: string
  inputRef: Ref<HTMLTextAreaElement> | undefined
}

// Held by `PromptInput`; the parts of the prompt read them, so that none of them is given its props.
export const PromptLooksContext = createContext<PromptLooksValue | null>(null)
export const PromptTextContext = createContext<PromptTextValue | null>(null)
export const PromptSubmitContext = createContext<PromptSubmitValue | null>(null)
export const PromptFieldContext = createContext<PromptFieldValue | null>(null)
