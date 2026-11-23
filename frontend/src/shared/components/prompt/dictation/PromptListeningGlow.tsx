'use client'

import { DictationGlow } from '@/shared/components/dictation'

import { usePromptLooks } from '../hooks/usePromptInput'
import { dictationPolicies } from './dictation-policies.constants'

/**
 * The light behind the box of the prompt while it listens. Put it in the `behind` of the
 * `PromptBox`; there is none in a size of prompt that has a light behind it already.
 */
export function PromptListeningGlow() {
  const { size } = usePromptLooks()
  if (!dictationPolicies[size].hasGlow) return null

  return <DictationGlow />
}
