'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDownIcon } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { useForm } from 'react-hook-form'

import {
  noRunDefaultsFieldValues,
  RunDefaultsFields,
  useRunSettingsOptions,
} from '@/modules/run/entities'
import { Form, FormField, TextField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible'
import { DialogClose, DialogFooter } from '@/shared/components/ui/dialog'
import { FieldError, FieldGroup } from '@/shared/components/ui/field'
import { PendingButton } from '@/shared/components/ui/pending-button'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  type OutputLanguage,
  outputLanguageLabels,
  outputLanguages,
} from '@/shared/config/output-language'

import { useCreateProject } from '../hooks/useCreateProject'
import { createProjectMessages } from '../new-project.constants'
import { newProjectFormSchemaOf } from '../new-project.schema'

interface NewProjectFormProps {
  /** The idea that the prompt sent, which becomes the first message of the project. */
  idea: string
  defaultLanguage: OutputLanguage
  onCreated: () => void
}

export function NewProjectForm({ idea, defaultLanguage, onCreated }: NewProjectFormProps) {
  const { checkpoints, parameterFields } = useRunSettingsOptions()
  const schema = useMemo(() => newProjectFormSchemaOf(parameterFields), [parameterFields])
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      output_language: defaultLanguage,
      idea,
      run_config: noRunDefaultsFieldValues,
    },
  })
  const createProject = useCreateProject({
    setError: form.setError,
    onCreated,
    schema,
    parameterFields,
  })

  const onSubmit = form.handleSubmit((values) => {
    createProject.mutate(values)
  })

  return (
    <Form onSubmit={onSubmit} className="grid min-h-0 grid-rows-body-footer gap-6">
      {/* The fields scroll and the buttons stay. The padding keeps the focus rings of the fields
          inside the area, which clips what overflows it, and leaves the right edge to its
          scrollbar, in the padding of the dialog. */}
      <ScrollArea className="-mr-3 -ml-1 min-h-0">
        <FieldGroup className="py-1 pr-3 pl-1">
          <TextField
            control={form.control}
            name="name"
            label="Name (optional)"
            placeholder="Named from the idea if left empty"
            autoComplete="off"
          />
          <FormField control={form.control} name="idea" label="Idea">
            {(field, control) => <Textarea rows={3} className="max-h-48" {...field} {...control} />}
          </FormField>
          <FormField
            control={form.control}
            name="output_language"
            label="Language of the documents"
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
          <AgentSettings>
            <RunDefaultsFields
              control={form.control}
              path="run_config"
              legend={createProjectMessages.agentSettings}
              checkpoints={checkpoints}
              parameterFields={parameterFields}
            />
          </AgentSettings>
          <FieldError>{createProject.formError}</FieldError>
        </FieldGroup>
      </ScrollArea>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={createProject.isPending}>
            Cancel
          </Button>
        </DialogClose>
        <PendingButton
          type="submit"
          pending={createProject.isPending}
          pendingLabel="Creating the project"
        >
          {createProjectMessages.create}
        </PendingButton>
      </DialogFooter>
    </Form>
  )
}

/** The settings that the agents start from, folded under a line that opens them: most people keep the defaults. */
function AgentSettings({ children }: { children: ReactNode }) {
  return (
    <Collapsible>
      {/* As large as the labels of the other fields, since it is one more setting of the project;
          its weight, its color and its chevron say that it opens. */}
      <h3>
        <CollapsibleTrigger className="group flex items-center gap-1.5 rounded-md text-sm font-semibold text-primary outline-none hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring/50">
          {createProjectMessages.agentSettings}
          <ChevronDownIcon
            aria-hidden
            className="size-4 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </CollapsibleTrigger>
      </h3>
      <CollapsibleContent className="pt-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}
