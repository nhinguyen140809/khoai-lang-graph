'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api-fetch.utils'

import { useCreateProject } from '../hooks/useCreateProject'
import {
  type OutputLanguage,
  outputLanguageLabels,
  outputLanguages,
  outputLanguageSchema,
} from '../projects.types'

const formSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name.'),
  description: z.string(),
  output_language: outputLanguageSchema,
})

type FormValues = z.infer<typeof formSchema>

const formFields = ['name', 'description', 'output_language'] as const

function isFormField(field: string): field is keyof FormValues {
  return formFields.some((name) => name === field)
}

interface NewProjectFormProps {
  defaultLanguage: OutputLanguage
  onCreated: () => void
}

export function NewProjectForm({ defaultLanguage, onCreated }: NewProjectFormProps) {
  const router = useRouter()
  const createProject = useCreateProject()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '', output_language: defaultLanguage },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    const description = values.description.trim()
    createProject.mutate(
      {
        name: values.name,
        description: description === '' ? null : description,
        output_language: values.output_language,
      },
      {
        onSuccess: ({ projectId, threadId }) => {
          onCreated()
          router.push(
            `/projects/${encodeURIComponent(projectId)}/chat/${encodeURIComponent(threadId)}`,
          )
        },
        onError: (error) => {
          if (!(error instanceof ApiError)) return
          for (const { field, message } of error.fieldErrors) {
            if (isFormField(field)) form.setError(field, { message })
          }
        },
      },
    )
  })

  // Field problems are shown at their field; any other failure under the form.
  const formError =
    createProject.isError &&
    !(createProject.error instanceof ApiError && createProject.error.fieldErrors.length > 0)
      ? createProject.error.message
      : null

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void onSubmit(event)
      }}
    >
      <FieldGroup>
        <Field data-invalid={errors.name !== undefined}>
          <FieldLabel htmlFor="new-project-name">Name</FieldLabel>
          <Input
            id="new-project-name"
            autoComplete="off"
            aria-invalid={errors.name !== undefined}
            {...form.register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={errors.description !== undefined}>
          <FieldLabel htmlFor="new-project-description">Description (optional)</FieldLabel>
          <Textarea
            id="new-project-description"
            rows={3}
            placeholder="The product and its domain"
            aria-invalid={errors.description !== undefined}
            {...form.register('description')}
          />
          <FieldError errors={[errors.description]} />
        </Field>
        <Field data-invalid={errors.output_language !== undefined}>
          <FieldLabel htmlFor="new-project-language">Output language</FieldLabel>
          <Controller
            name="output_language"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="new-project-language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {outputLanguages.map((language) => (
                    <SelectItem key={language} value={language}>
                      {outputLanguageLabels[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldDescription>The language the agents write the artifacts in.</FieldDescription>
          <FieldError errors={[errors.output_language]} />
        </Field>
        {formError !== null && (
          <p role="alert" className="text-xs text-destructive">
            {formError}
          </p>
        )}
      </FieldGroup>
      <DialogFooter className="mt-6">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={createProject.isPending}>
          {createProject.isPending && <Spinner aria-label="Creating the project" />}
          Create project
        </Button>
      </DialogFooter>
    </form>
  )
}
