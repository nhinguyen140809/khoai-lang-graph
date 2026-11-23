import type { UiCommand } from '@/modules/thread/entities'

import { allArtifacts } from '../artifacts/artifacts.lookup'
import type { MockAnswer } from './messages.types'

// How the mock tells a message about the app from a message about the work, in place of the model
// that the API asks: a few sentences that name something of the app. Each rule answers one kind of
// them, and a rule is a line, so a new kind of answer is a new entry. Anything else is about the
// work, which starts or joins a run.

type AssistantRule = (content: string, projectId: string) => MockAnswer | null

function reply(
  text: string,
  ...commands: (Partial<UiCommand> & { command: string })[]
): MockAnswer {
  return {
    text,
    commands: commands.map((command) => ({
      artifact_id: null,
      item_id: null,
      label: null,
      ...command,
    })),
  }
}

const rules: readonly AssistantRule[] = [
  (content) =>
    /^\s*(where|what|how|open|show)\b.*\b(settings|limits?)\b/i.test(content)
      ? reply('The settings hold the limits that a run works under. I opened them.', {
          command: 'open_settings',
          label: 'Run settings',
        })
      : null,
  (content) =>
    /\b(what is|what's) waiting\b|\b(go to|open) the review\b/i.test(content)
      ? reply('A review waits for you at the end of the chat.', {
          command: 'open_review',
          label: 'The review',
        })
      : null,
  (content, projectId) => {
    const asked = /^\s*open (?:the )?(.+?)[.!]?\s*$/i.exec(content)?.[1]?.toLowerCase()
    if (asked === undefined) return null
    const artifact = allArtifacts().find(
      ({ project_id: owner, title }) => owner === projectId && title.toLowerCase().includes(asked),
    )
    return artifact === undefined
      ? null
      : reply(`Here is ${artifact.title}.`, {
          command: 'open_document',
          artifact_id: artifact.id,
          label: artifact.title,
        })
  },
]

/** What the assistant answers to a message: its words and commands, or null for a message about the work. */
export function assistantAnswerOf(content: string, projectId: string): MockAnswer | null {
  for (const rule of rules) {
    const answer = rule(content, projectId)
    if (answer !== null) return answer
  }
  return null
}
