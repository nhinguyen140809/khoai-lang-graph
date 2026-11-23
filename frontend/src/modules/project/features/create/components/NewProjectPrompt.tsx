'use client'

import { type ReactNode, useId, useRef } from 'react'
import { toast } from 'sonner'

import { Reveal, TypedText, typedTextMs } from '@/shared/components/animation'
import { dictationProblemMessage } from '@/shared/components/dictation'
import {
  PromptBar,
  PromptBarEnd,
  PromptBox,
  PromptDictation,
  PromptDictationProvider,
  PromptFooter,
  PromptFooterEnd,
  PromptInput,
  PromptListeningGlow,
  PromptSend,
  PromptTextarea,
  usePromptDraft,
} from '@/shared/components/prompt'

import { useProjectPromptFocus } from '../hooks/useOpenProjectPrompt'
import { createProjectMessages, newProjectDraftName } from '../new-project.constants'

interface NewProjectPromptProps {
  /** Starts a project from the idea, trimmed. */
  onStart: (idea: string) => void
  /** Parts of the prompt that the place puts above the text in its box, such as the files chosen. */
  aboveText?: ReactNode
  /** Parts of the prompt that the place puts in the row under the box, before the dictation, such as a menu to add to the idea. */
  footerEnd?: ReactNode
}

/**
 * The prompt that starts a project from an idea: Enter, or the arrow once the prompt has text,
 * sends the idea, and Shift+Enter adds a line. It takes the focus when a command that starts a
 * project asks for it. What a place adds to it comes as parts, put where they belong, so that a new
 * one changes the place and not this prompt.
 */
export function NewProjectPrompt({ onStart, aboveText, footerEnd }: NewProjectPromptProps) {
  const id = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // The idea is kept as it is written, so that it is there again when the page loads.
  const [idea, setIdea] = usePromptDraft(newProjectDraftName)
  useProjectPromptFocus(inputRef)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-14">
      <h1
        id={`${id}-title`}
        className="text-center text-2xl font-semibold tracking-tight text-balance"
      >
        <TypedText text={createProjectMessages.promptTitle} />
      </h1>
      {/* The prompt fades in while the words of the title are typed, and is whole when the last one is. */}
      <Reveal duration={typedTextMs(createProjectMessages.promptTitle)}>
        <PromptInput
          labelledBy={`${id}-title`}
          value={idea}
          onValueChange={setIdea}
          onSubmit={onStart}
          inputRef={inputRef}
          keysHint="Enter to create the project, Shift+Enter for a new line"
        >
          <PromptDictationProvider
            onProblem={(problem) => {
              toast.error(dictationProblemMessage(problem))
            }}
          >
            <PromptBox behind={<PromptListeningGlow />}>
              {aboveText}
              <PromptTextarea placeholder="Describe the idea, who it is for and the problem it solves" />
              <PromptBar>
                <PromptBarEnd>
                  <PromptSend label={createProjectMessages.create} />
                </PromptBarEnd>
              </PromptBar>
            </PromptBox>
            <PromptFooter>
              <PromptFooterEnd>
                {footerEnd}
                <PromptDictation />
              </PromptFooterEnd>
            </PromptFooter>
          </PromptDictationProvider>
        </PromptInput>
      </Reveal>
    </div>
  )
}
