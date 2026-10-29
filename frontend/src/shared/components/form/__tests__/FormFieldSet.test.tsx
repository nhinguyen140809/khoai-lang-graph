import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { expectAlert, expectText, pressButton } from '@/test/steps'

import { FormFieldSet } from '../FormFieldSet'

const colors = ['Red', 'Blue']

const schema = z.object({ colors: z.array(z.string()).min(1, 'Choose a color.') })

function ColorsForm({ onSubmit }: { onSubmit: (values: z.infer<typeof schema>) => void }) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { colors: [] } })
  return (
    <form noValidate onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
      <FormFieldSet
        control={form.control}
        name="colors"
        legend="Colors"
        description="The colors of the page."
      >
        {(field) =>
          colors.map((color) => (
            <label key={color}>
              <input
                type="checkbox"
                checked={field.value.includes(color)}
                onChange={(event) => {
                  field.onChange(
                    event.target.checked
                      ? [...field.value, color]
                      : field.value.filter((chosen) => chosen !== color),
                  )
                }}
              />
              {color}
            </label>
          ))
        }
      </FormFieldSet>
      <button type="submit">Save</button>
    </form>
  )
}

describe('FormFieldSet', () => {
  it('names the group of controls with its legend, and shows its description', async () => {
    render(<ColorsForm onSubmit={() => undefined} />)

    const group = screen.getByRole('group', { name: 'Colors' })
    expect(group).toContainElement(screen.getByRole('checkbox', { name: 'Red' }))
    await expectText('The colors of the page.')
  })

  it('shows the error of the field and marks the group invalid', async () => {
    render(<ColorsForm onSubmit={() => undefined} />)

    await pressButton('Save')

    await expectAlert('Choose a color.')
    expect(screen.getByRole('group', { name: 'Colors' })).toHaveAttribute('data-invalid', 'true')
  })

  it('gives the form the values of the controls', async () => {
    const submitted: unknown[] = []
    render(<ColorsForm onSubmit={(values) => submitted.push(values)} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Blue' }))
    await pressButton('Save')

    await expect.poll(() => submitted).toEqual([{ colors: ['Blue'] }])
  })
})
