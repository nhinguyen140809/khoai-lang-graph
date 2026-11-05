import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import type { ContentField } from '../../fields/content-fields.types'
import { InlineFieldValues } from '../InlineFieldValues'

function field(overrides: Partial<ContentField>): ContentField {
  return {
    name: 'field',
    path: 'note.field',
    title: 'Field',
    widget: 'text',
    nullable: false,
    required: false,
    readOnly: false,
    options: [],
    description: null,
    allowedValuesFrom: null,
    valueList: null,
    minItems: null,
    minimum: null,
    maximum: null,
    integer: false,
    defaultValue: null,
    entryFields: [],
    ...overrides,
  }
}

const fields = [
  field({ name: 'type', title: 'Type' }),
  field({
    name: 'status',
    title: 'Status',
    path: 'persona.interview_status',
    widget: 'badge',
    options: ['not_started', 'in_progress', 'completed'],
  }),
]

describe('InlineFieldValues', () => {
  it('shows the filled fields in their order, each after its title for assistive technology', () => {
    renderWithProviders(
      <InlineFieldValues
        fields={fields}
        content={{ type: 'Student', status: 'completed' }}
        definition={undefined}
      />,
    )

    expect(screen.getByText('Student')).toBeInTheDocument()
    expect(screen.getByText('Interviewed')).toBeInTheDocument()
    expect(screen.getByText('Type:')).toHaveClass('sr-only')
    expect(screen.getByText('Status:')).toHaveClass('sr-only')
    // The second value of the line sits at a gap from the first.
    expect(screen.getByText('Interviewed').parentElement).toHaveClass('ml-3')
  })

  it('leaves out the empty fields', () => {
    renderWithProviders(
      <InlineFieldValues
        fields={fields}
        content={{ type: 'Student', status: '' }}
        definition={undefined}
      />,
    )

    expect(screen.getByText('Student')).toBeInTheDocument()
    expect(screen.queryByText('Status:')).not.toBeInTheDocument()
  })

  it('has no accessibility violation', async () => {
    const { container } = renderWithProviders(
      <InlineFieldValues
        fields={fields}
        content={{ type: 'Student', status: 'completed' }}
        definition={undefined}
      />,
    )

    await expectNoAccessibilityViolations(container)
  })
})
