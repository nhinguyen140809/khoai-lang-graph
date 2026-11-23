'use client'

import { use } from 'react'

import { DictationContext, type DictationValue } from '../DictationContext'

/** The dictation around a part, or null where there is none. */
export function useDictationContext(): DictationValue | null {
  return use(DictationContext)
}
