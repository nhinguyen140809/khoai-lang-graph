import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import type { LinkedEntry } from '../../types/item-links.types'
import { QuotedWordsPopover } from '../QuotedWordsPopover'

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

describe('QuotedWordsPopover', () => {
  it('opens on a click of its trigger and shows the card with the words of the other end in it', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <QuotedWordsPopover
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
        <button type="button">AR-001</button>
      </QuotedWordsPopover>,
    )

    await user.click(screen.getByRole('button', { name: 'AR-001' }))

    expect(await screen.findByText('Analysed requirement')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Analysed requirement, List mentors by field' }),
    ).toBeInTheDocument()
    expect(screen.getByText('This item is based on List mentors by field.')).toBeInTheDocument()
    expect(screen.getByText('lists mentors by field of study')).toBeInTheDocument()
    expect(screen.getByText('words that are gone')).toBeInTheDocument()
    expect(screen.getByText(/quotes these words\./)).toBeInTheDocument()
  })

  it('has no accessibility violation', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(
      <QuotedWordsPopover projectId={projectId} entries={[entryOf(analyzed)]}>
        <button type="button">AR-001</button>
      </QuotedWordsPopover>,
    )
    await user.click(screen.getByRole('button', { name: 'AR-001' }))
    await screen.findByText('This item is based on List mentors by field.')

    await expectNoAccessibilityViolations(container)
  })
})
