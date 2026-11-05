'use client'

import { FormProvider } from 'react-hook-form'

import { type Artifact, type UpdateArtifactBody } from '@/modules/artifact/entities'
import { contentFields, type ContentSchema } from '@/modules/workflow/entities'
import { Form, FormField, TextField } from '@/shared/components/form'
import { Alert } from '@/shared/components/ui/alert'
import { Textarea } from '@/shared/components/ui/textarea'

import { editMessages } from '../edit.constants'
import { artifactUpdateBody, initialContent } from '../edit.utils'
import { useEditForm } from '../hooks/useEditForm'
import { useEditingActions } from '../hooks/useEditingRecord'
import { useOpenDiscardChangesDialog } from '../hooks/useOpenDiscardChangesDialog'
import { useUpdateArtifact } from '../hooks/useUpdateArtifact'
import {
  editArtifactFormSchema,
  type EditArtifactFormValues,
} from '../schemas/edit-artifact.schema'
import { ContentFieldInputs } from './ContentFieldInputs'
import { EditFormFooter } from './EditFormFooter'

interface EditArtifactFormProps {
  artifact: Artifact
  schema: ContentSchema
  /** Why the record cannot change now, or null when it can. */
  lockedReason: string | null
  /** Runs after the save, once the answer is in the cache and the records have loaded again. */
  onChanged: () => Promise<void> | void
  /** Runs once, on the first change of the form, so that the page keeps its tab. */
  onFirstChange: () => void
}

/**
 * The form that edits an artifact: its title, its summary (an empty one is stored as null), then
 * the content fields of the schema of its kind in their order. Save sends only what changed; the
 * answer takes the detail, everything loads again, and the edit mode ends.
 */
export function EditArtifactForm({
  artifact,
  schema,
  lockedReason,
  onChanged,
  onFirstChange,
}: EditArtifactFormProps) {
  const fields = contentFields(schema)
  const formSchema = editArtifactFormSchema(fields)
  const form = useEditForm<EditArtifactFormValues>({
    schema: formSchema,
    defaultValues: {
      title: artifact.title,
      summary: artifact.summary ?? '',
      content: initialContent(fields, artifact.content),
    },
    firstField: 'title',
    onFirstChange,
  })
  const save = useUpdateArtifact(artifact, {
    setError: form.setError,
    schema: formSchema,
    onChanged,
  })
  const openDiscard = useOpenDiscardChangesDialog()
  const { stopEditing } = useEditingActions()

  const onSubmit = form.handleSubmit((values: EditArtifactFormValues) => {
    save.mutate(artifactUpdateBody(fields, artifact, values) satisfies UpdateArtifactBody)
  })
  const cancel = () => {
    if (form.formState.isDirty) openDiscard(`artifact:${artifact.id}`)
    else stopEditing()
  }

  return (
    <FormProvider {...form}>
      <Form onSubmit={onSubmit} className="space-y-6">
        {lockedReason !== null && <Alert>{lockedReason}</Alert>}
        <TextField
          control={form.control}
          name="title"
          label={editMessages.title}
          placeholder={editMessages.title}
        />
        <FormField control={form.control} name="summary" label={editMessages.summary}>
          {(controller) => (
            <Textarea
              className="field-sizing-content min-h-16"
              {...controller}
              value={typeof controller.value === 'string' ? controller.value : ''}
            />
          )}
        </FormField>
        <ContentFieldInputs projectId={artifact.project_id} fields={fields} />
        <EditFormFooter
          isClean={!form.formState.isDirty}
          isSaving={save.isPending}
          lockReason={lockedReason}
          conflict={{
            isConflict: save.isConflict,
            message: editMessages.conflict.artifact,
            onReload: save.reload,
          }}
          formError={save.formError}
          onCancel={cancel}
        />
      </Form>
    </FormProvider>
  )
}
