'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { type DefaultValues, type FieldValues, useForm } from 'react-hook-form'
import type { z } from 'zod'

/**
 * The form of an edit: the schema of its kind, its default values from the record, the focus on
 * its first field, and `onFirstChange`, which the first change of the form calls once, so that
 * the page keeps its tab. The check runs on Save, then again on each change of a field that has
 * a problem, with the focus going to the first wrong field: the defaults of react-hook-form.
 */
export function useEditForm<TValues extends FieldValues>({
  schema,
  defaultValues,
  firstField,
  onFirstChange,
}: {
  schema: z.ZodType<TValues, TValues>
  defaultValues: DefaultValues<TValues>
  /** The name of the field that takes the focus on mount, such as `title` of the artifact form. */
  firstField: string
  /** Runs once, on the first change of any field. */
  onFirstChange: () => void
}) {
  const form = useForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })
  const hasChanged = useRef(false)

  useEffect(() => {
    form.setFocus(firstField as never)
  }, [form, firstField])

  useEffect(() => {
    const subscription = form.watch(() => {
      if (hasChanged.current) return
      hasChanged.current = true
      onFirstChange()
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [form, onFirstChange])

  return form
}
