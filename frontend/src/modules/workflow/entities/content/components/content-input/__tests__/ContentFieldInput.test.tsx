import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { assertPresent } from '@/shared/lib/guards'
import { expectNoAccessibilityViolations, typeText } from '@/test/steps'

import type { ContentFormValues } from '../../../values/content-form.schema'
import { contentFormValuesSchema, withContentProblems } from '../../../values/content-form.schema'
import { ContentFieldInput } from '../ContentFieldInput'
import {
  type FieldChange,
  fieldOf,
  initialContent,
  nullableSelect,
  readOnlyField,
  widgetCases,
} from './ContentFieldInput.data'

// The schema of the form of the test: the fields of the schema the cases come from, so that the
// problem of a field lands at the field that shows it.
const schema = withContentProblems(
  contentFormValuesSchema,
  widgetCases.map(({ field }) => field),
)

/** A form of one content field, which says what it was saved with. */
function InputForm({
  field,
  initial = initialContent,
  allowedValues,
  onSaved,
}: {
  field: Parameters<typeof ContentFieldInput>[0]['field']
  initial?: Record<string, unknown> | undefined
  allowedValues?: readonly string[] | undefined
  onSaved: (values: ContentFormValues) => void
}) {
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { content: initial },
  })
  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => {
          void form.handleSubmit((values) => {
            onSaved(values)
          })(event)
        }}
      >
        <ContentFieldInput field={field} allowedValues={allowedValues} definition={undefined} />
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  )
}

/** Changes the control of the field as the case says. */
async function changeControl(user: ReturnType<typeof userEvent.setup>, change: FieldChange) {
  switch (change.kind) {
    case 'type': {
      const control = assertPresent(
        screen.queryByRole('textbox') ?? screen.queryByRole('spinbutton'),
        'The field has no control to type in',
      )
      await user.clear(control)
      await typeText(control, change.text)
      return
    }
    case 'select':
      await user.selectOptions(screen.getByRole('combobox'), change.option)
      return
    case 'click':
      await user.click(screen.getByRole('switch'))
      return
    case 'addEntry':
      await user.click(screen.getByRole('button', { name: 'Add' }))
      await typeText(
        assertPresent(screen.getAllByRole('textbox')[0], 'The new entry has no control'),
        change.text,
      )
      return
    case 'check':
      await user.click(screen.getByRole('checkbox', { name: change.label }))
  }
}

describe('ContentFieldInput', () => {
  it.each(widgetCases)(
    'changes the form value of $name',
    async ({ field, change, saved, allowedValues }) => {
      const user = userEvent.setup()
      const savedValues: ContentFormValues[] = []
      render(
        <InputForm
          field={field}
          allowedValues={allowedValues}
          onSaved={(values) => savedValues.push(values)}
        />,
      )

      await changeControl(user, change)
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(savedValues[0]?.content).toMatchObject({ ...initialContent, ...saved })
    },
  )

  it('stores null for a nullable select that is set to None', async () => {
    const user = userEvent.setup()
    const savedValues: ContentFormValues[] = []
    render(
      <InputForm
        field={assertPresent(nullableSelect, 'No nullable select')}
        initial={{ name: 'Ann', quality_category: 'performance' }}
        onSaved={(values) => savedValues.push(values)}
      />,
    )

    await user.selectOptions(screen.getByRole('combobox'), '')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(savedValues[0]?.content).toMatchObject({ quality_category: null })
  })

  it('offers the allowed values of a select that takes them from another artifact', async () => {
    const user = userEvent.setup()
    const savedValues: ContentFormValues[] = []
    render(
      <InputForm
        field={fieldOf('pick')}
        allowedValues={['search', 'booking', 'reminders']}
        onSaved={(values) => savedValues.push(values)}
      />,
    )

    const select = screen.getByRole('combobox', { name: 'Pick' })
    expect(screen.getByRole('option', { name: 'Choose a value' })).toBeDisabled()
    await user.selectOptions(select, 'booking')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(savedValues[0]?.content).toMatchObject({ pick: 'booking' })
  })

  it('shows the value of a field the user cannot edit, without a control', () => {
    render(
      <InputForm
        field={assertPresent(readOnlyField, 'No read only field')}
        initial={{ name: 'Ann', interview_status: 'completed' }}
        onSaved={() => undefined}
      />,
    )

    expect(screen.getByText('Interviewed')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows the problem of the field at the field', async () => {
    const user = userEvent.setup()
    render(<InputForm field={fieldOf('name')} initial={{ name: '' }} onSaved={() => undefined} />)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Enter a value.')).toBeInTheDocument()
  })

  it('has no accessibility violation', async () => {
    const { container } = render(<InputForm field={fieldOf('mood')} onSaved={() => undefined} />)
    await screen.findByRole('combobox', { name: 'Mood' })

    await expectNoAccessibilityViolations(container)
  })
})
