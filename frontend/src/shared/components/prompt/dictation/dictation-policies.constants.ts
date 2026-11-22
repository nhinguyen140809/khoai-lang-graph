import type { DictationSize } from '@/shared/components/dictation'

import type { PromptInputSize } from '../prompt-input.types'

/** What the dictation does in a size of prompt: how long the button that stops it is, and whether a light behind the box shows it. */
interface DictationPolicy {
  size: DictationSize
  /** A light behind the box shows the prompt listening, unless the page has a light behind the prompt already. */
  hasGlow: boolean
}

/**
 * What the dictation does in each size of the prompt. The prompt that starts a project has a light
 * behind it already, so it shows the dictation with a longer button and no light of its own; the
 * prompts of the chat show a short button and the light.
 */
export const dictationPolicies: Record<PromptInputSize, DictationPolicy> = {
  comfortable: { size: 'long', hasGlow: false },
  compact: { size: 'short', hasGlow: true },
  slim: { size: 'short', hasGlow: true },
}
