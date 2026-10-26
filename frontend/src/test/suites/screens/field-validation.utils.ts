import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'

import { recordRequests } from '../../msw'
import { fillFields, pressButton } from '../../steps'
import type { FieldValidationSuite } from './field-validation.types'

/**
 * Tests that a form shows the message of each field it refuses, and sends nothing: each case types
 * some fields, presses the button that sends, and reads the messages.
 */
export function itAsksForFieldsBeforeSending({
  renderForm,
  submitLabel,
  cases,
}: FieldValidationSuite) {
  it.each(cases)('asks for $name before sending', async ({ typed, messages }) => {
    const requests = recordRequests()
    renderForm()

    await fillFields(typed)
    await pressButton(submitLabel)

    for (const message of messages) expect(await screen.findByText(message)).toBeInTheDocument()
    expect(requests).toEqual([])
  })
}
