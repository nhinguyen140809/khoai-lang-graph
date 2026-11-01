'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormField, TextField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { DialogClose, DialogFooter } from '@/shared/components/ui/dialog'
import { FieldGroup } from '@/shared/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Spinner } from '@/shared/components/ui/spinner'
import { Textarea } from '@/shared/components/ui/textarea'

import { useCreateProject } from '../hooks/useCreateProject'
import { newProjectFormSchema } from '../projects.schema'
import { type OutputLanguage, outputLanguageLabels, outputLanguages } from '../projects.types'

interface NewProjectFormProps {
  defaultLanguage: OutputLanguage
  onCreated: () => void
}

export function NewProjectForm({ defaultLanguage, onCreated }: NewProjectFormProps) {
  const form = useForm({
    resolver: zodResolver(newProjectFormSchema),
    defaultValues: { name: '', description: '', output_language: defaultLanguage },
  })
  const createProject = useCreateProject(form.setError)

  const onSubmit = form.handleSubmit((body) => {
    createProject.mutate(body, { onSuccess: onCreated })
  })

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void onSubmit(event)
      }}
    >
      <FieldGroup>
        <TextField control={form.control} name="name" label="Name" autoComplete="off" />
        <FormField control={form.control} name="description" label="Description (optional)">
          {(field, control) => (
            <Textarea rows={3} placeholder="The product and its domain" {...field} {...control} />
          )}
        </FormField>
        <FormField
          control={form.control}
          name="output_language"
          label="Output language"
          description="The language the agents write the artifacts in."
        >
          {(field, control) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger {...control} className="w-full">
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
        </FormField>
        {createProject.formError !== null && (
          <p role="alert" className="text-xs text-destructive">
            {createProject.formError}
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
