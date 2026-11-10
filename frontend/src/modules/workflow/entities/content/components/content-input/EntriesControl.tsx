'use client'

import { PlusIcon, XIcon } from 'lucide-react'
import { useId, useRef } from 'react'

import type { FieldControlProps } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Field, FieldLabel, FieldSet } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { isRecord, isString } from '@/shared/lib/guards'

import type { WorkflowDefinition } from '../../../definition/workflow-definition.types'
import { type ContentField, hasObjectEntries } from '../../fields/content-fields.types'
import { contentInputMessages } from './content-input.constants'
import { ContentValueControl } from './ContentValueControl'

interface EntriesControlProps {
  field: ContentField
  entries: readonly unknown[]
  onChange: (entries: unknown[]) => void
  /** The values that a field with `x-value-from` may take, read by the form from the artifacts of the project. */
  allowedValues?: readonly string[] | undefined
  /** Titles the values of a field that names a value list; none until the definition loads. */
  definition: Pick<WorkflowDefinition, 'value_lists'> | undefined
  /** The id and `aria-invalid` that the label and the error of the field give the control. */
  controlProps?: FieldControlProps | undefined
}

// What the entry of an empty list starts as: a text for a list and for tags, an object for an
// object list.
function emptyEntry(field: ContentField): unknown {
  return hasObjectEntries(field.widget) ? {} : ''
}

/**
 * The entries of a `list`, a `tags` or an `object-list` field: one control per entry, a Remove
 * button per entry and Add under the last one. Every change replaces the whole list. Add appends an
 * empty entry and focuses its control; Remove focuses the entry that takes the place of the removed
 * one, else the one before, else Add. The entries keep their order; there is no reordering.
 */
export function EntriesControl({
  field,
  entries,
  onChange,
  allowedValues,
  definition,
  controlProps,
}: EntriesControlProps) {
  const baseId = useId()
  const wrappers = useRef<(HTMLElement | null)[]>([])
  const addButton = useRef<HTMLButtonElement>(null)

  // Focuses the control of the entry at `index`, once the change that asked for it has rendered;
  // a microtask runs after the render that the new state causes.
  const focusEntry = (index: number) => {
    void Promise.resolve().then(() => {
      wrappers.current[index]?.querySelector<HTMLElement>('input, textarea, select')?.focus()
    })
  }

  const add = () => {
    onChange([...entries, emptyEntry(field)])
    focusEntry(entries.length)
  }

  const remove = (index: number) => {
    const next = entries.toSpliced(index, 1)
    onChange(next)
    const takesItsPlace = Math.min(index, next.length - 1)
    if (takesItsPlace >= 0) focusEntry(takesItsPlace)
    else addButton.current?.focus()
  }

  const changeEntry = (index: number, value: unknown) => {
    onChange(entries.toSpliced(index, 1, value))
  }

  const changeEntryField = (index: number, name: string, value: unknown) => {
    const entry = entries[index]
    if (!isRecord(entry)) return
    onChange(entries.toSpliced(index, 1, { ...entry, [name]: value }))
  }

  /** The props that tie one entry control to the field: the first carries the id of the label. */
  const entryControlProps = (index: number): Partial<FieldControlProps> | undefined => {
    if (controlProps === undefined) return undefined
    return index === 0 ? controlProps : { 'aria-invalid': controlProps['aria-invalid'] }
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <div
          key={String(index)}
          className="flex items-start gap-1"
          ref={(wrapper) => {
            wrappers.current[index] = wrapper
          }}
        >
          <div className="min-w-0 flex-1">
            {hasObjectEntries(field.widget) ? (
              <FieldSet className="rounded-lg border p-4">
                {field.entryFields.map((entryField) => {
                  const id = `${baseId}-${String(index)}-${entryField.name}`
                  return (
                    <Field key={entryField.name}>
                      <FieldLabel htmlFor={id}>{entryField.title}</FieldLabel>
                      <ContentValueControl
                        field={entryField}
                        value={isRecord(entry) ? entry[entryField.name] : undefined}
                        onChange={(value) => {
                          changeEntryField(index, entryField.name, value)
                        }}
                        allowedValues={allowedValues}
                        definition={definition}
                        controlProps={{ id, 'aria-invalid': false }}
                      />
                    </Field>
                  )
                })}
              </FieldSet>
            ) : field.widget === 'list' ? (
              <Textarea
                {...entryControlProps(index)}
                className="field-sizing-content min-h-16"
                value={isString(entry) ? entry : ''}
                onChange={(event) => {
                  changeEntry(index, event.target.value)
                }}
              />
            ) : (
              <Input
                {...entryControlProps(index)}
                value={isString(entry) ? entry : ''}
                onChange={(event) => {
                  changeEntry(index, event.target.value)
                }}
              />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={contentInputMessages.removeEntry(index + 1, field.title)}
            onClick={() => {
              remove(index)
            }}
          >
            <XIcon />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" ref={addButton} onClick={add}>
        <PlusIcon data-icon="inline-start" />
        {contentInputMessages.add}
      </Button>
    </div>
  )
}
