'use client'

import { createContext } from 'react'

import type { useDictation } from './hooks/useDictation'

/** What the parts that show or follow a dictation share: whether it listens, the level of the voice, and how to start and end it. */
export type DictationValue = ReturnType<typeof useDictation>

/** Held by `DictationProvider`; null where there is no dictation, which the parts then leave alone. */
export const DictationContext = createContext<DictationValue | null>(null)
