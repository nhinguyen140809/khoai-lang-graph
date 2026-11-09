import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { routes } from '@/shared/routes'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { QuotedItemCard } from '../QuotedItemCard'

const href = routes.project(projectIds.mentor).item('00000000-0000-4000-8000-000000000001')

// An item that is named by its own words: its title is the whole message, so a quote of it sits in
// its title.
const message = {
  key: 'RAW-002',
  content: {
    turn: 2,
    speaker: 'PER-001',
    content: 'I ask seniors in my club, but I never know who is free this week, so I give up.',
  },
  schema: contentSchemaFixtureByKind('interview_message'),
}

// An item with a title of its own and a statement, which says what the item is about.
const requirement = {
  key: 'AR-010',
  content: {
    title: 'Search within 2 seconds',
    statement: 'A search result is listed within 2 seconds.',
    type: 'non_functional',
    quality_category: 'performance',
    priority: 'should',
    rationale: 'Students leave a slow page.',
  },
  schema: contentSchemaFixtureByKind('analyzed_requirement'),
}

function renderCard(item: typeof message | typeof requirement, quote: string | null) {
  return renderWithProviders(
    <QuotedItemCard href={href} kind="Kind" item={item} quote={quote} side="source" />,
  )
}

describe('QuotedItemCard', () => {
  it('marks the quoted words in the title of an item that has no words but its title, and says them once', () => {
    const { container } = renderCard(message, 'NEVER know  who is free this week')

    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(1)
    // The mark keeps the words of the title, whatever the case or the spacing of the quote.
    expect(marks[0]).toHaveTextContent('never know who is free this week')
    expect(screen.getByRole('link')).toHaveTextContent(message.content.content)
    expect(screen.getByRole('link').querySelector('mark')).not.toBeNull()
    // No second line repeats the words under the title.
    expect(container.querySelectorAll('[data-slot="quote-excerpt"]')).toHaveLength(0)
  })

  it('marks the words in the statement under the title when the statement holds them, even if the title does too', () => {
    const { container } = renderCard(requirement, 'within 2 seconds')

    // The title is only a name: it stays plain and the statement shows the words in their place.
    expect(screen.getByRole('link')).toHaveTextContent('Search within 2 seconds')
    expect(screen.getByRole('link').querySelector('mark')).toBeNull()
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveTextContent('within 2 seconds')
    expect(marks[0]?.closest('[data-slot="quote-excerpt"]')).toHaveTextContent(
      'A search result is listed within 2 seconds.',
    )
  })

  it('cuts a long statement around the words, with an ellipsis at each end that was cut', () => {
    const statement = `${'The system keeps a long account of every booking of every mentor. '.repeat(4)}It lists a result within 2 seconds. ${'Later it archives the result of every search for a year. '.repeat(4)}`
    const { container } = renderCard(
      { ...requirement, content: { ...requirement.content, statement } },
      'within 2 seconds',
    )

    const paragraph = container.querySelector('[data-slot="quote-excerpt"]')
    expect(paragraph?.textContent.startsWith('...')).toBe(true)
    expect(paragraph?.textContent.endsWith('...')).toBe(true)
    expect(paragraph?.textContent.length).toBeLessThan(statement.length)
    expect(container.querySelector('mark')).toHaveTextContent('within 2 seconds')
  })

  it('shows the quote itself under the title when no field holds the words', () => {
    const { container } = renderCard(requirement, 'a couple of seconds')

    expect(screen.getByRole('link')).toHaveTextContent('Search within 2 seconds')
    expect(screen.getByRole('link').querySelector('mark')).toBeNull()
    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveTextContent('a couple of seconds')
  })

  it('shows the kind and the title alone when the link quotes no words of the item', () => {
    const { container } = renderCard(requirement, null)

    expect(screen.getByText('Kind')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveTextContent('Search within 2 seconds')
    expect(container.querySelectorAll('mark')).toHaveLength(0)
  })

  it('shows the title alone for a quote of blank words', () => {
    const { container } = renderCard(requirement, '   ')

    expect(container.querySelectorAll('mark')).toHaveLength(0)
    expect(container.querySelectorAll('[data-slot="quote-excerpt"]')).toHaveLength(0)
  })

  it('has no accessibility violations', async () => {
    const { container } = renderCard(requirement, 'within 2 seconds')

    await expectNoAccessibilityViolations(container)
  })
})
