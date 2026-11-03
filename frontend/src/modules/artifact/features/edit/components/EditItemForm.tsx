'use client'

import { FormProvider } from 'react-hook-form'

import { type ArtifactItem, type UpdateItemBody } from '@/modules/artifact/entities'
import { contentFields, type ContentSchema } from '@/modules/workflow/entities'
import { Form } from '@/shared/components/form'
import { Alert } from '@/shared/components/ui/alert'

import { editMessages } from '../edit.constants'
import { initialContent, itemUpdateBody } from '../edit.utils'
import { useEditForm } from '../hooks/useEditForm'
import { useEditingActions } from '../hooks/useEditingRecord'
import { useOpenDiscardChangesDialog } from '../hooks/useOpenDiscardChangesDialog'
import { useUpdateItem } from '../hooks/useUpdateItem'
import { editItemFormSchema, type EditItemFormValues } from '../schemas/edit-item.schema'
import { ContentFieldInputs } from './ContentFieldInputs'
import { EditFormFooter } from './EditFormFooter'

interface EditItemFormProps {
  item: ArtifactItem
  schema: ContentSchema
  /** Why the record cannot change now, or null when it can. */
  lockedReason: string | null
  /** Runs after the save, once the answer is in the cache and the records have loaded again. */
  onChanged: () => Promise<void> | void
  /** Runs once, on the first change of the form, so that the page keeps its tab. */
  onFirstChange: () => void
}

/**
 * The form that edits an item: the content fields of the schema of its kind in their order, the
 * empty optional ones included, with Save and Cancel under them. Save sends only the fields that
 * changed; the answer takes the detail, everything loads again, and the edit mode ends.
 */
export function EditItemForm({
  item,
  schema,
  lockedReason,
  onChanged,
  onFirstChange,
}: EditItemFormProps) {
  const fields = contentFields(schema)
  const formSchema = editItemFormSchema(fields)
  const form = useEditForm<EditItemFormValues>({
    schema: formSchema,
    defaultValues: { content: initialContent(fields, item.content) },
    firstField: `content.${fields[0]?.name ?? ''}`,
    onFirstChange,
  })
  const save = useUpdateItem(item, { setError: form.setError, schema: formSchema, onChanged })
  const openDiscard = useOpenDiscardChangesDialog()
  const { stopEditing } = useEditingActions()

  const onSubmit = form.handleSubmit((values: EditItemFormValues) => {
    save.mutate(itemUpdateBody(fields, item, values) satisfies UpdateItemBody)
  })
  const cancel = () => {
    if (form.formState.isDirty) openDiscard(`item:${item.id}`)
    else stopEditing()
  }

  return (
    <FormProvider {...form}>
      <Form onSubmit={onSubmit} className="space-y-6">
        {lockedReason !== null && <Alert>{lockedReason}</Alert>}
        <ContentFieldInputs projectId={item.project_id} fields={fields} />
        <EditFormFooter
          isClean={!form.formState.isDirty}
          isSaving={save.isPending}
          lockReason={lockedReason}
          conflict={{
            isConflict: save.isConflict,
            message: editMessages.conflict.item,
            onReload: save.reload,
          }}
          formError={save.formError}
          onCancel={cancel}
        />
      </Form>
    </FormProvider>
  )
}
