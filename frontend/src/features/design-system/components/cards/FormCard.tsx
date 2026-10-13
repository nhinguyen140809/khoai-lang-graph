'use client'

import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/shared/ui/combobox'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'

const agentRoles = [
  'planner',
  'persona_generator',
  'interviewer',
  'persona_agent',
  'analyst',
  'requirement_engineer',
] as const

const checkpoints = ['checkpoint_personas', 'checkpoint_analysis', 'checkpoint_spec'] as const

export function FormCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New project</CardTitle>
        <CardDescription>
          Field, input, textarea, select, combobox, checkbox, switch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="ds-project-name">Name</FieldLabel>
            <Input id="ds-project-name" defaultValue="Mentor platform" />
          </Field>
          <Field>
            <FieldLabel htmlFor="ds-project-description">Description</FieldLabel>
            <Textarea id="ds-project-description" placeholder="The product and its domain" />
            <FieldDescription>Agents read it before the first interview.</FieldDescription>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="ds-output-language">Output language</FieldLabel>
              <Select defaultValue="en">
                <SelectTrigger id="ds-output-language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="vi">Vietnamese</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="ds-workflow-version">Workflow</FieldLabel>
              <Select defaultValue="1">
                <SelectTrigger id="ds-workflow-version" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Version 1</SelectItem>
                  <SelectItem value="2">Version 2</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="ds-model-role">Model override for</FieldLabel>
            <Combobox items={agentRoles}>
              <ComboboxInput id="ds-model-role" placeholder="Choose an agent role" />
              <ComboboxContent>
                <ComboboxEmpty>No role found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>
          <FieldSet>
            <FieldLegend variant="label">Review at</FieldLegend>
            <FieldGroup className="gap-2">
              {checkpoints.map((checkpoint) => (
                <Field key={checkpoint} orientation="horizontal">
                  <Checkbox id={`ds-${checkpoint}`} defaultChecked />
                  <FieldLabel htmlFor={`ds-${checkpoint}`} className="font-mono font-normal">
                    {checkpoint}
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Switch id="ds-start-run" />
            <FieldLabel htmlFor="ds-start-run">Start the first run now</FieldLabel>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Create project</Button>
      </CardFooter>
    </Card>
  )
}
