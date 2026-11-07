'use client'

import { useId, useRef, useState } from 'react'

import { PromptInput } from '@/shared/components/prompt'

import { useProjectPromptFocus } from '../hooks/useOpenProjectPrompt'
import { createProjectMessages } from '../new-project.constants'

interface NewProjectPromptProps {
  /** Starts a project from the idea, trimmed. */
  onStart: (idea: string) => void
}

/**
 * The prompt that starts a project from an idea: Enter, or the arrow once the prompt has text,
 * sends the idea, and Shift+Enter adds a line. It takes the focus when a command that starts a
 * project asks for it.
 */
export function NewProjectPrompt({ onStart }: NewProjectPromptProps) {
  const id = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [idea, setIdea] = useState('')
  useProjectPromptFocus(inputRef)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <h1
        id={`${id}-title`}
        className="text-center text-2xl font-semibold tracking-tight text-balance"
      >
        What product do you want to write the requirements for?
      </h1>
      <PromptInput
        labelledBy={`${id}-title`}
        value={idea}
        onValueChange={setIdea}
        onSubmit={onStart}
        inputRef={inputRef}
        submitLabel={createProjectMessages.create}
        keysHint="Enter to create the project, Shift+Enter for a new line"
        placeholder="Describe the idea, who it is for and the problem it solves"
      />
    </div>
  )
}
