import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { assertPresent } from '@/shared/lib/guards'

import { noRunDefaultsFieldValues } from '../../config/run-defaults.constants'
import type { RunDefaultsFieldValues } from '../../config/run-defaults.schema'
import { RunDefaultsFields } from '../RunDefaultsFields'
import { runSettingsOptions } from './RunDefaultsFields.data'

function SettingsForm() {
  const form = useForm<RunDefaultsFieldValues>({ defaultValues: noRunDefaultsFieldValues })
  return (
    <form>
      <RunDefaultsFields control={form.control} legend="Run settings" {...runSettingsOptions} />
    </form>
  )
}

/** Two sets of the fields in one form, as a page with two levels of settings would hold them. */
function TwoLevelsForm() {
  const form = useForm<{ first: RunDefaultsFieldValues; second: RunDefaultsFieldValues }>({
    defaultValues: { first: noRunDefaultsFieldValues, second: noRunDefaultsFieldValues },
  })
  return (
    <form>
      <RunDefaultsFields
        control={form.control}
        path="first"
        legend="First"
        {...runSettingsOptions}
      />
      <RunDefaultsFields
        control={form.control}
        path="second"
        legend="Second"
        {...runSettingsOptions}
      />
    </form>
  )
}

describe('RunDefaultsFields', () => {
  it('shows the limits and the parameters of the workflow under the legend', () => {
    render(<SettingsForm />)

    const fields = screen.getByRole('group', { name: 'Run settings' })
    expect(fields).toContainElement(screen.getByRole('spinbutton', { name: 'Maximum steps' }))
    expect(screen.getByRole('spinbutton', { name: 'Cost limit (USD)' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Max turns' })).toBeInTheDocument()
    expect(screen.getByText(/A run in progress keeps its settings/)).toBeInTheDocument()
  })

  it('offers the reviews, in a group of their own, once the default is turned off', async () => {
    render(<SettingsForm />)
    const reviews = screen.getByRole('group', { name: 'Reviews' })
    const analysis = screen.getByRole('checkbox', { name: 'Review the analysis' })
    expect(reviews).toContainElement(analysis)
    expect(analysis).toBeDisabled()

    await userEvent.click(screen.getByRole('switch', { name: 'Default' }))

    expect(analysis).toBeEnabled()
  })

  it('ties each label to the checkbox of its own fields', async () => {
    render(<TwoLevelsForm />)
    const first = within(screen.getByRole('group', { name: 'First' }))
    const second = within(screen.getByRole('group', { name: 'Second' }))

    // The label of the switch comes before the radio buttons of the flags, which are named alike.
    await userEvent.click(
      assertPresent(second.getAllByText('Default', { selector: 'label' })[0], 'No label'),
    )

    expect(first.getByRole('switch', { name: 'Default' })).toBeChecked()
    expect(second.getByRole('switch', { name: 'Default' })).not.toBeChecked()
  })
})
