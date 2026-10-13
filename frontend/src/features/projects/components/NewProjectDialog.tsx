'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

import { useProjectDefaults } from '../hooks/useProjectDefaults'
import { useNewProjectDialogStore } from '../new-project.store'
import { NewProjectForm } from './NewProjectForm'

/** Asks for the name, description and output language of a project, then opens its console. */
export function NewProjectDialog() {
  const open = useNewProjectDialogStore((state) => state.open)
  const setOpen = useNewProjectDialogStore((state) => state.setOpen)
  // Loaded before the dialog opens, so that the form starts with the language of the user.
  const defaults = useProjectDefaults()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            A project holds the requirements of one product. It opens on an empty console: the first
            message starts the first run.
          </DialogDescription>
        </DialogHeader>
        <NewProjectForm
          defaultLanguage={defaults.data?.default_output_language ?? 'en'}
          onCreated={() => {
            setOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
