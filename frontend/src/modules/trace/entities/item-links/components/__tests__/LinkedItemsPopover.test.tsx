import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import type { LinkedEntry } from '../../item-links.types'
import { LinkedItemsPopover } from '../LinkedItemsPopover'

const projectId = projectIds.mentor
const analyzed = itemFixtureByKey(projectId, 'AR-001')
const issue = itemFixtureByKey(projectId, 'AMB-001')

function entryOf(item: typeof analyzed, overrides: Partial<LinkedEntry> = {}): LinkedEntry {
  return {
    item,
    relation: { direction: 'outgoing', linkType: 'derived_from' },
    isOutOfDate: false,
    otherQuote: null,
    quoteColor: 'chart',
    madeFromVersion: null,
    ...overrides,
  }
}

describe('LinkedItemsPopover', () => {
  it('opens on a click of its trigger and shows the entries', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <LinkedItemsPopover projectId={projectId} entries={[entryOf(analyzed)]}>
        <button type="button">AR-001</button>
      </LinkedItemsPopover>,
    )

    await user.click(screen.getByRole('button', { name: 'AR-001' }))

    expect(
      await screen.findByText('This item is based on List mentors by field.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Analysed requirement')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Analysed requirement, List mentors by field' }),
    ).toBeInTheDocument()
  })

  it('shows the words the link quotes at its other end, in the color of that end', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <LinkedItemsPopover
        projectId={projectId}
        entries={[
          entryOf(analyzed, { otherQuote: 'lists mentors by field of study' }),
          entryOf(issue, {
            relation: { direction: 'quotes' },
            otherQuote: 'words that are gone',
            quoteColor: 'primary',
          }),
        ]}
      >
        <button type="button">Open the card</button>
      </LinkedItemsPopover>,
    )

    await user.click(screen.getByRole('button', { name: 'Open the card' }))

    expect(await screen.findByText('lists mentors by field of study')).toBeInTheDocument()
    expect(screen.getByText('words that are gone')).toBeInTheDocument()
    expect(screen.getByText(/quotes these words\./)).toBeInTheDocument()
  })

  it('says from which version an out of date link was made', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <LinkedItemsPopover
        projectId={projectId}
        entries={[entryOf(analyzed, { isOutOfDate: true, madeFromVersion: 1 })]}
      >
        <button type="button">AR-001</button>
      </LinkedItemsPopover>,
    )

    await user.click(screen.getByRole('button', { name: 'AR-001' }))

    expect(
      await screen.findByText('This link was made from version 1, and the item is now version 1.'),
    ).toBeInTheDocument()
  })

  it('puts the words a link quotes where the item holds them: in the title of an item that has only its title', async () => {
    const user = userEvent.setup()
    const message = {
      ...analyzed,
      kind: 'interview_message',
      content: {
        turn: 2,
        speaker: 'PER-001',
        content: 'I ask seniors in my club, but I never know who is free this week, so I give up.',
      },
    }
    renderWithProviders(
      <LinkedItemsPopover
        projectId={projectId}
        entries={[entryOf(message, { otherQuote: 'who is free this week' })]}
      >
        <button type="button">Open the card</button>
      </LinkedItemsPopover>,
    )

    await user.click(screen.getByRole('button', { name: 'Open the card' }))

    // The words are marked in the title, which is the item's own words, and said once.
    const mark = await screen.findByText('who is free this week')
    expect(mark.tagName).toBe('MARK')
    expect(mark.closest('[data-slot="quote-excerpt"]')).toBeNull()
    expect(document.querySelectorAll('mark')).toHaveLength(1)
    expect(document.querySelector('[data-slot="quote-excerpt"]')).toBeNull()
  })

  it('marks the words in the sentence of the field that holds them, under the title', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <LinkedItemsPopover
        projectId={projectId}
        entries={[entryOf(analyzed, { otherQuote: 'lists mentors by field of study' })]}
      >
        <button type="button">Open the card</button>
      </LinkedItemsPopover>,
    )

    await user.click(screen.getByRole('button', { name: 'Open the card' }))

    // The statement of the analysis holds the words, so the title stays plain and the sentence shows them.
    const mark = await screen.findByText('lists mentors by field of study')
    expect(mark.closest('[data-slot="quote-excerpt"]')).toHaveTextContent(
      'The system lists mentors by field of study.',
    )
  })

  it('has no accessibility violation', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(
      <LinkedItemsPopover projectId={projectId} entries={[entryOf(analyzed)]}>
        <button type="button">AR-001</button>
      </LinkedItemsPopover>,
    )
    await user.click(screen.getByRole('button', { name: 'AR-001' }))
    await screen.findByText('This item is based on List mentors by field.')

    await expectNoAccessibilityViolations(container)
  })
})
