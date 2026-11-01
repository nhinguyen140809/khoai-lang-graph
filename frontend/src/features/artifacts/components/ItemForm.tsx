'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldTitle } from '@/shared/components/ui/field'
import { Spinner } from '@/shared/components/ui/spinner'

import { itemFormSchema } from '../artifacts.schema'
import type { ArtifactItem, ContentSchema } from '../artifacts.types'
import { emptyValue, type FieldView, fieldViews } from '../field-view.utils'
import { useUpdateItem } from '../hooks/useItemMutations'
import { FieldInput } from './FieldInput'
import { FieldValue } from './FieldValue'

interface ItemFormProps {
  item: ArtifactItem
  schema: ContentSchema
  onDone: () => void
}

function FieldName({ view }: { view: FieldView }) {
  return (
    <>
      {view.label}
      {view.required && !view.nullable && <span aria-hidden> *</span>}
    </>
  )
}

/** The edit form of an item: one input for each field of its schema, the widget set by the schema. */
export function ItemForm({ item, schema, onDone }: ItemFormProps) {
  const views = useMemo(() => fieldViews(schema), [schema])
  const formSchema = useMemo(() => itemFormSchema(views), [views])
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: Object.fromEntries(
      views
        .filter((view) => !view.readOnly)
        .map((view) => [view.name, item.content[view.name] ?? emptyValue(view)]),
    ),
  })
  const update = useUpdateItem(item, form.setError, formSchema)

  const onSubmit = form.handleSubmit((content) => {
    update.mutate(content, { onSuccess: onDone })
  })

  return (
    <form
      noValidate
      aria-label={`Edit ${item.key}`}
      onSubmit={(event) => {
        void onSubmit(event)
      }}
    >
      <FieldGroup>
        {views.map((view) =>
          view.readOnly ? (
            <Field key={view.name}>
              <FieldTitle>
                <FieldName view={view} />
              </FieldTitle>
              <FieldValue view={view} value={item.content[view.name]} />
              {view.description !== null && <FieldDescription>{view.description}</FieldDescription>}
              <FieldDescription>Set by the system; not editable.</FieldDescription>
            </Field>
          ) : (
            <FormField
              key={view.name}
              control={form.control}
              name={view.name}
              label={<FieldName view={view} />}
              description={view.description ?? undefined}
            >
              {(field, control) => (
                <FieldInput
                  id={control.id}
                  projectId={item.project_id}
                  view={view}
                  value={field.value}
                  invalid={control['aria-invalid']}
                  onChange={field.onChange}
                />
              )}
            </FormField>
          ),
        )}

        {update.formError !== null && (
          <p role="alert" className="text-sm text-destructive-strong">
            {update.formError}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending && <Spinner className="size-4" />}
            Save
          </Button>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
