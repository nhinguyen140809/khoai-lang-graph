import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations, expectText } from '@/test/steps'

import type { ContentField } from '../../fields/content-fields.types'
import { FieldSeparator } from '../FieldSeparator'

function field(overrides: Partial<ContentField>): ContentField {
  return {
    name: 'field',
    path: 'note.field',
    title: 'Field',
    widget: 'separator',
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
    rating: null,
    ...overrides,
  }
}

const turn = field({ name: 'turn', title: 'Turn', integer: true, minimum: 1 })
const status = field({ name: 'status', title: 'Status', options: ['in_progress', 'completed'] })

describe('FieldSeparator', () => {
  it('reads a number as its title and its value', async () => {
    renderWithProviders(
      <FieldSeparator fields={[turn]} content={{ turn: 2 }} definition={undefined} />,
    )

    await expectText('Turn 2')
  })

  it('reads a choice as the label of its value', async () => {
    renderWithProviders(
      <FieldSeparator fields={[status]} content={{ status: 'completed' }} definition={undefined} />,
    )

    await expectText('Completed')
  })

  it('holds the fields that change at one place side by side', () => {
    renderWithProviders(
      <FieldSeparator
        fields={[turn, status]}
        content={{ turn: 2, status: 'completed' }}
        definition={undefined}
      />,
    )

    const separator = screen.getByText('Turn 2').closest('[data-slot="marker"]')
    expect(screen.getByText('Completed').closest('[data-slot="marker"]')).toBe(separator)
    expect(screen.getByText('Completed')).toHaveClass('ml-3')
  })

  it('reads a text as itself', async () => {
    renderWithProviders(
      <FieldSeparator
        fields={[field({ name: 'note', title: 'Note' })]}
        content={{ note: 'A place' }}
        definition={undefined}
      />,
    )

    await expectText('A place')
  })

  it('shows nothing when no field is filled', () => {
    const { container } = renderWithProviders(
      <FieldSeparator
        fields={[turn, status]}
        content={{ turn: null, status: '' }}
        definition={undefined}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('has no accessibility violation', async () => {
    const { container } = renderWithProviders(
      <FieldSeparator
        fields={[turn, status]}
        content={{ turn: 2, status: 'completed' }}
        definition={undefined}
      />,
    )

    await expectNoAccessibilityViolations(container)
  })
})
