'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import type { Project } from '@/modules/project/entities'
import { Form, TextField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { FieldError, FieldGroup } from '@/shared/components/ui/field'
import { PendingButton } from '@/shared/components/ui/pending-button'

import { useRenameProject } from './hooks/useRenameProject'
import { renameProjectMessages } from './rename-project.constants'
import { renameProjectFormSchema } from './rename-project.schema'

interface RenameProjectDialogProps {
  project: Pick<Project, 'id' | 'name'>
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Runs once the dialog has closed, after its animation. */
  onClosed?: () => void
}

/**
 * Renames a project, from the menu of its row, the menu of the open project or the command palette,
 * which open it through `ProjectDialogs`. The dialog closes once the projects show the new name.
 */
export function RenameProjectDialog({
  project,
  open,
  onOpenChange,
  onClosed,
}: RenameProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The title says it all: a description would only repeat the button. */}
      <DialogContent size="md" aria-describedby={undefined} onCloseAutoFocus={() => onClosed?.()}>
        <DialogHeader>
          <DialogTitle>{renameProjectMessages.rename}</DialogTitle>
        </DialogHeader>
        <RenameProjectForm
          project={project}
          onRenamed={() => {
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

interface RenameProjectFormProps {
  project: Pick<Project, 'id' | 'name'>
  onRenamed: () => void
}

/** The name of the project, selected so that typing replaces it; empty while the agents name it. */
function RenameProjectForm({ project, onRenamed }: RenameProjectFormProps) {
  const form = useForm({
    resolver: zodResolver(renameProjectFormSchema),
    defaultValues: { name: project.name ?? '' },
  })
  const rename = useRenameProject(project.id, form.setError, onRenamed)

  // Before the dialog moves the focus to its first field, which it leaves where it is.
  useEffect(() => {
    form.setFocus('name', { shouldSelect: true })
  }, [form])

  const onSubmit = form.handleSubmit((values) => {
    rename.mutate(values)
  })

  return (
    <Form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <TextField control={form.control} name="name" label="Name" autoComplete="off" />
        <FieldError>{rename.formError}</FieldError>
      </FieldGroup>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <PendingButton type="submit" pending={rename.isPending} pendingLabel="Renaming the project">
          Rename
        </PendingButton>
      </DialogFooter>
    </Form>
  )
}
