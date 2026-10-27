import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  expectAlert,
  expectInvalidField,
  expectRole,
  expectText,
  expectValidField,
  pasteText,
  pressButton,
} from '@/test/steps'

import { TextField } from '../TextField'
import { blankNames, typedNameCases } from './TextField.data'

const schema = z.object({ name: z.string().trim().min(1, 'Enter a name.') })

interface NameFormProps {
  onSubmit: (values: z.infer<typeof schema>) => void
  action?: ReactNode
}

function NameForm({ onSubmit, action }: NameFormProps) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: '' } })
  return (
    <form noValidate onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
      <TextField
        control={form.control}
        name="name"
        label="Name"
        description="As others see it."
        autoComplete="name"
        action={action}
      />
      <button type="submit">Save</button>
    </form>
  )
}

/** Types the name as a paste, which takes an empty text too, then saves. */
async function enterName(text: string) {
  await userEvent.click(screen.getByLabelText('Name'))
  await pasteText(text)
  await pressButton('Save')
}

describe('TextField', () => {
  it('ties the input to its label and its description', async () => {
    render(<NameForm onSubmit={() => undefined} />)

    const input = screen.getByLabelText('Name')
    expect(input).toHaveAttribute('autocomplete', 'name')
    expectValidField(input)
    await expectText('As others see it.')
  })

  it.each(blankNames)(
    'shows the error of the field for %j and marks the input invalid',
    async (typed) => {
      render(<NameForm onSubmit={() => undefined} />)

      await enterName(typed)

      await expectAlert('Enter a name.')
      expectInvalidField('Name')
    },
  )

  it('keeps the action of the field beside its error', async () => {
    render(<NameForm onSubmit={() => undefined} action={<button type="button">Help</button>} />)

    await enterName('')

    await expectAlert('Enter a name.')
    await expectRole('button', 'Help')
  })

  it.each(typedNameCases)('gives the form $value for $typed', async ({ typed, value }) => {
    const submitted: unknown[] = []
    render(<NameForm onSubmit={(values) => submitted.push(values)} />)

    await enterName(typed)

    await expect.poll(() => submitted).toEqual([{ name: value }])
  })
})
