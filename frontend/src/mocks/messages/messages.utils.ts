import { hasText } from '@/shared/lib/guards'

// How many words of the first message name a project without a name, or a thread without a title.
const NAME_WORDS = 5

/**
 * The name that the mock gives in place of the agents: the first words of the first line of the
 * first message, naming a project without a name or a thread without a title.
 */
export function nameFromMessage(content: string): string {
  const line = content.split('\n').find(hasText) ?? ''
  return line
    .trim()
    .split(/\s+/)
    .slice(0, NAME_WORDS)
    .join(' ')
    .replace(/[.,;:!?]+$/, '')
}
