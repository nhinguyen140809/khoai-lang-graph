import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  expectAlert,
  expectInvalidField,
  expectText,
  expectValidField,
  pasteText,
  pressButton,
} from '@/test/steps'

import { NumberField } from '../NumberField'
import { acceptedCounts, refusedCounts } from './NumberField.data'

const schema = z.object({
  count: z
    .number({ error: 'Enter a number.' })
    .int('Enter a whole number.')
    .min(0, 'Use zero or more.')
    .max(20, 'Use at most 20.'),
})

interface CountFormProps {
  onSubmit: (values: z.infer<typeof schema>) => void
  integer?: boolean
}

function CountForm({ onSubmit, integer = true }: CountFormProps) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: {} })
  return (
    <form noValidate onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
      <NumberField
        control={form.control}
        name="count"
        label="Count"
        description="Between 0 and 20."
        min={0}
        max={20}
        integer={integer}
      />
      <button type="submit">Save</button>
    </form>
  )
}

const field = () => screen.getByRole('spinbutton', { name: 'Count' })

async function enterCount(typed: string) {
  await userEvent.click(field())
  if (typed !== '') await pasteText(typed)
  await pressButton('Save')
}

describe('NumberField', () => {
  it('ties the input to its label and its description', async () => {
    render(<CountForm onSubmit={() => undefined} />)

    expectValidField(field())
    expect(field()).toHaveAttribute('aria-valuemax', '20')
    await expectText('Between 0 and 20.')
  })

  it.each(refusedCounts)(
    'shows the message of the schema for $name and marks the input invalid',
    async ({ typed, message }) => {
      render(<CountForm onSubmit={() => undefined} />)

      await enterCount(typed)

      await expectAlert(message)
      expectInvalidField(field())
    },
  )

  it('leaves the check of a decimal to the schema when the input takes decimals', async () => {
    render(<CountForm onSubmit={() => undefined} integer={false} />)

    await enterCount('2.5')

    await expectAlert('Enter a whole number.')
  })

  it.each(acceptedCounts)(
    'gives the form the number $value for $typed',
    async ({ typed, value }) => {
      const submitted: unknown[] = []
      render(<CountForm onSubmit={(values) => submitted.push(values)} />)

      await enterCount(typed)

      await expect.poll(() => submitted).toEqual([{ count: value }])
    },
  )

  it('gives the form the number that the arrows lead to', async () => {
    const submitted: unknown[] = []
    render(<CountForm onSubmit={(values) => submitted.push(values)} />)

    await pressButton('Increase')
    await pressButton('Increase')
    await pressButton('Save')

    await expect.poll(() => submitted).toEqual([{ count: 1 }])
  })

  it('gives the form no number again once the input is emptied', async () => {
    render(<CountForm onSubmit={() => undefined} />)

    await userEvent.click(field())
    await pasteText('5')
    await userEvent.clear(field())
    await pressButton('Save')

    await expectAlert('Enter a number.')
  })
})
