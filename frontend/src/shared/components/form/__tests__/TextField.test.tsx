import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { TextField } from '../TextField'

const schema = z.object({ name: z.string().trim().min(1, 'Enter a name.') })

function NameForm({ onSubmit }: { onSubmit: (values: z.infer<typeof schema>) => void }) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: '' } })
  return (
    <form noValidate onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
      <TextField
        control={form.control}
        name="name"
        label="Name"
        description="As others see it."
        autoComplete="name"
      />
      <button type="submit">Save</button>
    </form>
  )
}

describe('TextField', () => {
  it('ties the input to its label and its description', () => {
    render(<NameForm onSubmit={() => undefined} />)

    const input = screen.getByLabelText('Name')
    expect(input).toHaveAttribute('autocomplete', 'name')
    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByText('As others see it.')).toBeInTheDocument()
  })

  it('shows the error of the field and marks the input invalid', async () => {
    render(<NameForm onSubmit={() => undefined} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a name.')
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
  })

  it('gives the form what was typed', async () => {
    const submitted: unknown[] = []
    render(<NameForm onSubmit={(values) => submitted.push(values)} />)

    await userEvent.type(screen.getByLabelText('Name'), '  Linh  ')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await expect.poll(() => submitted).toEqual([{ name: 'Linh' }])
  })
})
