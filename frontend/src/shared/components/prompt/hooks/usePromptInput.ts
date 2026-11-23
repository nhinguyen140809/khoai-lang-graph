'use client'

import { type Context, use } from 'react'

import {
  PromptFieldContext,
  type PromptFieldValue,
  PromptLooksContext,
  type PromptLooksValue,
  PromptSubmitContext,
  type PromptSubmitValue,
  PromptTextContext,
  type PromptTextValue,
} from '../PromptInputContext'

/** What one context of the prompt around a part holds; a part is drawn inside a `PromptInput`. */
function usePromptContext<T>(context: Context<T | null>): T {
  const value = use(context)
  if (value === null) throw new Error('A part of the prompt is drawn outside a PromptInput.')
  return value
}

/** How the size of the prompt shows its parts. */
export function usePromptLooks(): PromptLooksValue {
  return usePromptContext(PromptLooksContext)
}

/** The text of the prompt; the part that reads it is drawn again with every key. */
export function usePromptText(): PromptTextValue {
  return usePromptContext(PromptTextContext)
}

/** How the text of the prompt is sent. */
export function usePromptSubmit(): PromptSubmitValue {
  return usePromptContext(PromptSubmitContext)
}

/** What names the field of the prompt and holds its element. */
export function usePromptField(): PromptFieldValue {
  return usePromptContext(PromptFieldContext)
}
