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

  it('shows a value of a badge in the tone written for the field, with no dot', () => {
    renderWithProviders(
      <ContentFieldValue
        field={field({
          widget: 'badge',
          path: 'persona.interview_status',
          options: ['not_started', 'in_progress', 'completed'],
        })}
        value="in_progress"
        definition={undefined}
      />,
    )

    const badge = screen.getByText('Interview in progress').closest('[data-slot="badge"]')
    expect(badge).toHaveAttribute('data-color', 'primary')
    expect(badge).toHaveAttribute('data-variant', 'soft')
    expect(badge?.querySelectorAll('*').length).toBe(0)
  })

  it('draws the people of an avatar list, each its avatar and its name', () => {
    renderWithProviders(
      <ContentFieldValue
        field={field({ widget: 'avatar-list' })}
        value={[
          { key: 'interviewer', name: 'Interviewer', role: 'interviewer', item_id: null },
          { key: 'PER-001', name: 'Ann', role: 'persona', item_id: 'item-1' },
        ]}
        definition={undefined}
      />,
    )

    expect(screen.getByText('Interviewer')).toBeInTheDocument()
    expect(screen.getByText('Ann')).toBeInTheDocument()
    expect(screen.getByText('I')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('draws a person with an item as the link the caller gives, in the look of a button', () => {
    renderWithProviders(
      <ContentFieldValue
        field={field({ widget: 'avatar-list' })}
        value={[{ key: 'PER-001', name: 'Ann', role: 'persona', item_id: 'item-1' }]}
        definition={undefined}
        renderItemIdLink={(itemId, children) => (
          <a key={itemId} href={`/items/${itemId}`}>
            {children}
          </a>
        )}
      />,
    )

    const link = screen.getByRole('link', { name: 'Ann' })
    expect(link).toHaveAttribute('href', '/items/item-1')
    expect(link).toHaveAttribute('data-variant', 'outline')
    expect(link.querySelector('[data-slot="avatar-fallback"]')).toHaveAttribute(
      'data-color',
      'primary',
    )
  })

  it('draws a person without an item, or without a link, as its avatar and name only', () => {
    const cases = [
      { key: 'PER-001', name: 'Ann', role: 'persona', item_id: null },
      { key: 'PER-002', name: 'Bea', role: 'persona', item_id: 'item-2' },
    ]

    const { rerender } = renderWithProviders(
      <ContentFieldValue
        field={field({ widget: 'avatar-list' })}
        value={cases}
        definition={undefined}
      />,
    )
    expect(screen.queryByRole('link')).not.toBeInTheDocument()

    rerender(
      <ContentFieldValue
        field={field({ widget: 'avatar-list' })}
        value={cases}
        definition={undefined}
        renderItemIdLink={(itemId, children) => (
          <a key={itemId} href={`/items/${itemId}`}>
            {children}
          </a>
        )}
      />,
    )
    // The person without an item is not a link; only the one with an item is.
    expect(screen.queryByRole('link', { name: 'Ann' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bea' })).toBeInTheDocument()
  })
})

describe('ContentFieldValue with marks', () => {
  it('draws a text value with its marks, wrapped by the wrapper of each range', async () => {
    renderWithProviders(
      <ContentFieldValue
        field={field({ widget: 'textarea' })}
        value="The system shall list mentors."
        definition={undefined}
        marks={[{ start: 11, end: 29 }]}
        renderMark={(range, children) => <em key={range.start}>{children}</em>}
      />,
    )

    const marked = await screen.findByText('shall list mentors')
    expect(marked.closest('em')).not.toBeNull()
    expect(marked.closest('mark')).not.toBeNull()
  })

  it('ignores the marks of a value that is not a text', () => {
    const { container } = renderWithProviders(
      <ContentFieldValue
        field={field({ widget: 'boolean' })}
        value={true}
        definition={undefined}
        marks={[{ start: 0, end: 1 }]}
      />,
    )

    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(container.querySelector('mark')).toBeNull()
  })
})
