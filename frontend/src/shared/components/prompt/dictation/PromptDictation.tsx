'use client'

import { DictationButton } from '@/shared/components/dictation'

import { usePromptLooks } from '../hooks/usePromptInput'
import { dictationPolicies } from './dictation-policies.constants'

/** The dictation of the prompt: its button, as long as the size of the prompt says. */
export function PromptDictation() {
  const { size } = usePromptLooks()

  return <DictationButton size={dictationPolicies[size].size} />
}
