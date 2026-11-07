'use client'

import { ArrowUpIcon, ChevronRightIcon } from 'lucide-react'
import { type KeyboardEvent, useId, useRef, useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/shared/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { hasText } from '@/shared/lib/guards'
import { isSubmitKey } from '@/shared/lib/hotkey'

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
  const isBlank = !hasText(idea)
  useProjectPromptFocus(inputRef)

  const submit = () => {
    if (!isBlank) onStart(idea.trim())
  }

  const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSubmitKey(event.nativeEvent)) return
    event.preventDefault()
    submit()
  }

  return (
    <form
      aria-labelledby={`${id}-title`}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="flex flex-col gap-8"
    >
      <h1
        id={`${id}-title`}
        className="text-center text-2xl font-semibold tracking-tight text-balance"
      >
        What product do you want to write the requirements for?
      </h1>
      {/* The box of the main input of the page keeps the fill of a card, so that it stands out,
          where other inputs have none. */}
      <InputGroup className="bg-card dark:bg-card">
        {/* The mark of a prompt, in the padding of the box, since an addon before the text box
            would sit above it in a box laid out in a column. */}
        <ChevronRightIcon
          aria-hidden
          className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
        />
        <InputGroupTextarea
          ref={inputRef}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-keys`}
          value={idea}
          rows={3}
          placeholder="Describe the idea, who it is for and the problem it solves"
          onChange={(event) => {
            setIdea(event.target.value)
          }}
          onKeyDown={submitOnEnter}
          className="max-h-60 min-h-16 pt-2.5 pl-9 leading-relaxed"
        />
        <InputGroupAddon align="block-end" className="justify-end">
          {/* Only assistive technology reads the keys; on screen, the arrow sends the idea. */}
          <p id={`${id}-keys`} className="sr-only">
            Enter to create the project, Shift+Enter for a new line
          </p>
          {/* An arrow up, as the prompts of chat assistants send their text; its name is in the
              tooltip. It waits for an idea. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                disabled={isBlank}
                aria-label={createProjectMessages.create}
              >
                <ArrowUpIcon aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{createProjectMessages.create}</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}
