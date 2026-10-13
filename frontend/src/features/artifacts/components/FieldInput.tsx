'use client'

import { PlusIcon, XIcon } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'

import type { FieldView } from '../field-view.utils'
import { useValueOptions } from '../hooks/useValueOptions'

// The value of the choice that stores `null`, for a select that can be empty.
const NONE = '__none__'

interface FieldInputProps {
  id: string
  projectId: string
  view: FieldView
  value: unknown
  onChange: (value: unknown) => void
  invalid: boolean
}

/** The input of one field, chosen by its widget. */
export function FieldInput({ id, projectId, view, value, onChange, invalid }: FieldInputProps) {
  const fromArtifact = useValueOptions(projectId, view.valueFrom)

  switch (view.widget) {
    case 'textarea':
      return (
        <Textarea
          id={id}
          rows={3}
          aria-invalid={invalid}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => {
            onChange(event.target.value)
          }}
        />
      )
    case 'number':
      return (
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          aria-invalid={invalid}
          {...(view.minimum !== null && { min: view.minimum })}
          {...(view.maximum !== null && { max: view.maximum })}
          value={typeof value === 'number' || typeof value === 'string' ? value : ''}
          onChange={(event) => {
            onChange(event.target.value)
          }}
        />
      )
    case 'select': {
      const options = view.options.length > 0 ? view.options : fromArtifact
      const selected = typeof value === 'string' && value !== '' ? value : view.nullable ? NONE : ''
      return (
        <Select
          value={selected}
          onValueChange={(next) => {
            onChange(next === NONE ? null : next)
          }}
        >
          <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
            <SelectValue placeholder="Choose a value" />
          </SelectTrigger>
          <SelectContent>
            {view.nullable && <SelectItem value={NONE}>None</SelectItem>}
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    case 'list':
    case 'tags':
      return (
        <EntryList
          id={id}
          label={view.label}
          values={Array.isArray(value) ? value.map(String) : []}
          onChange={onChange}
          invalid={invalid}
        />
      )
    case 'object-list':
      return (
        <ObjectList
          id={id}
          view={view}
          entries={Array.isArray(value) ? (value as Record<string, unknown>[]) : []}
          onChange={onChange}
        />
      )
    default:
      return (
        <Input
          id={id}
          aria-invalid={invalid}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => {
            onChange(event.target.value)
          }}
        />
      )
  }
}

interface EntryListProps {
  id: string
  label: string
  values: string[]
  onChange: (values: string[]) => void
  invalid: boolean
}

function EntryList({ id, label, values, onChange, invalid }: EntryListProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {values.map((entry, index) => (
        // The entries have no id of their own, so the position names an entry.
        <div key={index} className="flex gap-1.5">
          <Input
            id={index === 0 ? id : undefined}
            aria-label={`${label} ${String(index + 1)}`}
            aria-invalid={invalid}
            value={entry}
            onChange={(event) => {
              onChange(values.map((current, at) => (at === index ? event.target.value : current)))
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${label} ${String(index + 1)}`}
            onClick={() => {
              onChange(values.filter((_, at) => at !== index))
            }}
          >
            <XIcon aria-hidden />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="self-start"
        onClick={() => {
          onChange([...values, ''])
        }}
      >
        <PlusIcon aria-hidden />
        Add
      </Button>
    </div>
  )
}

interface ObjectListProps {
  id: string
  view: FieldView
  entries: Record<string, unknown>[]
  onChange: (entries: Record<string, unknown>[]) => void
}

function ObjectList({ id, view, entries, onChange }: ObjectListProps) {
  return (
    <div className="flex flex-col gap-2" id={id}>
      {entries.map((entry, index) => (
        <div key={index} className="flex flex-col gap-1.5 rounded-md border p-2">
          {view.entryFields.map((field) => (
            <label key={field.name} className="flex items-center gap-2 text-xs">
              <span className="w-24 shrink-0 text-muted-foreground">{field.label}</span>
              <Input
                value={typeof entry[field.name] === 'string' ? (entry[field.name] as string) : ''}
                onChange={(event) => {
                  onChange(
                    entries.map((current, at) =>
                      at === index ? { ...current, [field.name]: event.target.value } : current,
                    ),
                  )
                }}
              />
            </label>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="self-end"
            onClick={() => {
              onChange(entries.filter((_, at) => at !== index))
            }}
          >
            Remove entry
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="self-start"
        onClick={() => {
          onChange([
            ...entries,
            Object.fromEntries(view.entryFields.map((field) => [field.name, ''])),
          ])
        }}
      >
        <PlusIcon aria-hidden />
        Add entry
      </Button>
    </div>
  )
}
