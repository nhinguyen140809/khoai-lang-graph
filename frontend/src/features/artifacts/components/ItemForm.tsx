'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { ApiError } from '@/lib/api-fetch.utils'

import type { ArtifactItem, ContentSchema } from '../artifacts.types'
import { emptyValue, fieldViews, toStoredContent, validateContent } from '../field-view.utils'
import { useUpdateItem } from '../hooks/useItemMutations'
import { FieldInput } from './FieldInput'
import { FieldValue } from './FieldValue'

interface ItemFormProps {
  item: ArtifactItem
  schema: ContentSchema
  onDone: () => void
}

/** The edit form of an item: one input for each field of its schema, the widget set by the schema. */
export function ItemForm({ item, schema, onDone }: ItemFormProps) {
  const views = fieldViews(schema)
  const form = useForm<Record<string, unknown>>({
    defaultValues: Object.fromEntries(
      views.map((view) => [view.name, item.content[view.name] ?? emptyValue(view)]),
    ),
  })
  const update = useUpdateItem(item)
  const [problem, setProblem] = useState<{ conflict: boolean; message: string } | null>(null)
  const { errors } = form.formState

  const submit = form.handleSubmit((values) => {
    setProblem(null)
    const found = validateContent(views, values)
    const names = Object.keys(found)
    if (names.length > 0) {
      for (const name of names) form.setError(name, { message: found[name] ?? 'Enter a value.' })
      return
    }
    update.mutate(toStoredContent(views, values), {
      onSuccess: onDone,
      onError: (error) => {
        if (!(error instanceof ApiError)) {
          setProblem({ conflict: false, message: error.message })
          return
        }
        for (const { field, message } of error.fieldErrors) {
          form.setError(field.replace(/^content\./, ''), { message })
        }
        if (error.fieldErrors.length === 0) {
          setProblem({ conflict: error.code === 'version_conflict', message: error.message })
        }
      },
    })
  })

  return (
    <form
      noValidate
      aria-label={`Edit ${item.key}`}
      onSubmit={(event) => {
        void submit(event)
      }}
    >
      <FieldGroup>
        {views.map((view) => {
          const inputId = `item-${item.id}-${view.name}`
          const error = errors[view.name]
          return (
            <Field key={view.name} data-invalid={error !== undefined}>
              <FieldLabel htmlFor={inputId}>
                {view.label}
                {view.required && !view.nullable && <span aria-hidden> *</span>}
              </FieldLabel>
              {view.readOnly ? (
                <FieldValue view={view} value={item.content[view.name]} />
              ) : (
                <Controller
                  name={view.name}
                  control={form.control}
                  render={({ field }) => (
                    <FieldInput
                      id={inputId}
                      projectId={item.project_id}
                      view={view}
                      value={field.value}
                      invalid={error !== undefined}
                      onChange={field.onChange}
                    />
                  )}
                />
              )}
              {view.description !== null && <FieldDescription>{view.description}</FieldDescription>}
              {view.readOnly && (
                <FieldDescription>Set by the system; not editable.</FieldDescription>
              )}
              <FieldError errors={[error]} />
            </Field>
          )
        })}

        {problem !== null && (
          <p role="alert" className="text-sm text-destructive-strong">
            {problem.message}
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
