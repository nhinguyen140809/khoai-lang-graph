import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { ContentFieldValue } from '../ContentFieldValue'
import { emptyCases, field, objectListCase, valueCases } from './ContentFieldValue.data'

describe('ContentFieldValue', () => {
  it.each(valueCases)('shows $name', async ({ field: contentField, value, shown }) => {
    renderWithProviders(
      <ContentFieldValue
        field={contentField}
        value={value}
        definition={workflowDefinitionFixture}
      />,
    )

    for (const text of shown) {
      await waitFor(() => {
        expect(screen.getByText(text)).toBeInTheDocument()
      })
    }
  })

  it.each(emptyCases)('renders nothing for $name', ({ value }) => {
    const { container } = renderWithProviders(
      <ContentFieldValue field={field({})} value={value} definition={undefined} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('leaves out the empty entries of an object list', async () => {
    const { container } = renderWithProviders(
      <ContentFieldValue
        field={objectListCase.field}
        value={[{ who: 'Ann', what: '' }]}
        definition={undefined}
      />,
    )

    expect(screen.queryByText('What:')).not.toBeInTheDocument()
    await expectNoAccessibilityViolations(container)
  })
})
