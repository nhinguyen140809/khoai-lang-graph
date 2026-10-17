'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'

import { projectMessages } from '../../constants/projects.constants'
import { useIsCreatingProject } from '../../hooks/useCreateProject'
import { NewProjectForm } from './NewProjectForm'

interface NewProjectDialogProps {
  open: boolean
  /** The idea that the prompt sent. */
  idea: string
  onOpenChange: (open: boolean) => void
}

/**
 * Checks the settings of a new project before it is created, on the idea that the prompt sent.
 * Once created, the project gets the idea as its first message and opens at its activity. The
 * dialog stays open while the project is created, since the project exists either way.
 */
export function NewProjectDialog({ open, idea, onOpenChange }: NewProjectDialogProps) {
  const creating = useIsCreatingProject()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!creating) onOpenChange(next)
      }}
    >
      {/* The title says it all: a description would only repeat the button. At most 80% of the
          window high, so that the open agent settings scroll between the title and the buttons. */}
      <DialogContent
        className="max-h-[80dvh] grid-rows-[auto_minmax(0,1fr)] sm:max-w-lg"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{projectMessages.create}</DialogTitle>
        </DialogHeader>
        <NewProjectForm
          idea={idea}
          defaultLanguage="en"
          onCreated={() => {
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
