import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import type { RunParameterField } from '@/modules/workflow/entities/@x/run'
import { assertPresent } from '@/shared/lib/guards'
import { expectRole, pressRole } from '@/test/steps'

import { ParameterField } from '../ParameterField'
import {
  choiceField,
  controlCases,
  flagField,
  flagWithDefaultField,
  numberWithDefault,
} from './ParameterField.data'

interface Values {
  value: unknown
}

function ParameterForm({ field, initial = '' }: { field: RunParameterField; initial?: unknown }) {
  const form = useForm<Values>({ defaultValues: { value: initial } })
  return <ParameterField control={form.control} name="value" field={field} />
}

describe('ParameterField', () => {
  it.each(controlCases)('shows $name as a $role', async ({ field, role, label }) => {
    if (field === undefined) throw new Error('The case has no field')

    render(<ParameterForm field={field} />)

    await expectRole(role, label)
  })

  it.each([
    { name: 'left to the default', initial: null, checked: 'Default' },
    { name: 'on', initial: true, checked: 'On' },
    { name: 'off', initial: false, checked: 'Off' },
  ])('shows a flag that is $name as one of three choices', ({ initial, checked }) => {
    render(<ParameterForm field={assertPresent(flagField, 'No flag field')} initial={initial} />)

    expect(screen.getByRole('radio', { name: checked })).toBeChecked()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('shows the default of a number as its placeholder', () => {
    render(<ParameterForm field={assertPresent(numberWithDefault, 'No number field')} />)

    expect(screen.getByRole('spinbutton', { name: 'Turns left' })).toHaveAttribute(
      'placeholder',
      '6',
    )
  })

  it('shows the default of a flag in the choice that leaves it to the default', () => {
    render(
      <ParameterForm field={assertPresent(flagWithDefaultField, 'No flag field')} initial={null} />,
    )

    expect(screen.getByRole('radio', { name: 'Default (Off)' })).toBeChecked()
  })

  it('shows a choice as its values and sets the one that is picked', async () => {
    render(<ParameterForm field={assertPresent(choiceField, 'No choice field')} initial="" />)

    expect(screen.getByRole('combobox', { name: 'Mode' })).toHaveTextContent('Default')

    await pressRole('combobox', 'Mode')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Default',
      'fast',
      'deep',
    ])
    await pressRole('option', 'deep')

    expect(screen.getByRole('combobox', { name: 'Mode' })).toHaveTextContent('deep')
  })

  it('changes a flag from the default to on and off', async () => {
    render(<ParameterForm field={assertPresent(flagField, 'No flag field')} initial={null} />)

    await pressRole('radio', 'On')
    expect(screen.getByRole('radio', { name: 'On' })).toBeChecked()

    await pressRole('radio', 'Off')
    expect(screen.getByRole('radio', { name: 'Off' })).toBeChecked()
  })
})
