import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ItemLinksResult } from '@/modules/trace/entities'
import { renderWithProviders } from '@/test/render'
import {
  expectNoAccessibilityViolations,
  expectNoRole,
  expectRole,
  expectText,
  pressButton,
  pressEscape,
} from '@/test/steps'

import { ItemLinkLine } from '../ItemLinkLine'

/** A success result of useItemLinks with one outgoing group of six chips and one incoming. */
const links = {
  state: 'success',
  outgoing: [
    {
      linkType: 'derived_from',
      title: 'Based on',
      rows: [1, 2, 3, 4, 5, 6].map((n) => ({
        link: {
          id: `l${String(n)}`,
          source_item_id: 'item',
          target_item_id: `other-${String(n)}`,
          link_type: 'derived_from',
          target_version: 1,
          target_quote: null,
          source_quote: null,
          note: null,
        },
        other: {
          id: `other-${String(n)}`,
          artifact_id: 'artifact-1',
          key: `AR-00${String(n)}`,
          kind: 'analyzed_requirement',
          version: 1,
          review_status: 'approved' as const,
          content: { title: `Requirement ${String(n)}`, statement: 'x' },
        },
        kindTitle: 'Analysed requirement',
        title: `Requirement ${String(n)}`,
        isOutOfDate: n === 6,
      })),
    },
  ],
  incoming: [
    {
      linkType: 'concerns',
      title: 'Applies to',
      rows: [
        {
          link: {
            id: 'l7',
            source_item_id: 'issue-1',
            target_item_id: 'item',
            link_type: 'concerns',
            target_version: 1,
            target_quote: 'within 2 seconds',
            source_quote: null,
            note: null,
          },
          other: {
            id: 'issue-1',
            artifact_id: 'artifact-1',
            key: 'AMB-001',
            kind: 'ambiguity_issue',
            version: 1,
            review_status: 'approved' as const,
            content: { title: 'Fast has no number' },
          },
          kindTitle: 'Point to clarify',
          title: 'Fast has no number',
          isOutOfDate: false,
        },
      ],
    },
  ],
  count: 7,
  fieldMarks: new Map(),
  rowsByLinkId: new Map(),
} satisfies ItemLinksResult

function renderLine() {
  return renderWithProviders(<ItemLinkLine projectId="p1" links={links} lockedReason={null} />)
}

describe('ItemLinkLine', () => {
  it('shows the groups in their short words, the chips with the kind and the title of the other item, and "1 more" for the rest', async () => {
    renderLine()

    await expectText('Based on')
    await expectText('Applies to this item')
    await expectRole('button', 'Analysed requirement, Requirement 1')
    await expectRole('button', 'Analysed requirement, Requirement 5')
    expectNoRole('button', 'Analysed requirement, Requirement 6')
    await expectRole('button', '1 more')
  })

  it('marks an out of date chip with the warning sign, in its label', async () => {
    renderLine()

    await pressButton('1 more')
    const chip = screen.getByRole('button', {
      name: 'Analysed requirement, Requirement 6, made from an older version',
    })
    expect(chip.querySelector('svg')).not.toBeNull()
  })

  it('shows the rest of a group in place on "N more", and opens the card of a chip', async () => {
    renderLine()

    await pressButton('1 more')
    await expectRole('button', /Analysed requirement, Requirement 6/)

    await pressButton('Analysed requirement, Requirement 1')
    await expectRole('link', 'Analysed requirement, Requirement 1')
  })

  it('offers to remove the link in the menu of the card of an outgoing chip, not of an incoming one', async () => {
    renderLine()

    await pressButton('Analysed requirement, Requirement 1')
    await pressButton('More actions')
    await expectRole('menuitem', 'Remove this link')

    await pressEscape()
    await pressEscape()
    await pressButton('Point to clarify, Fast has no number')
    await expectText(/applies to this item/)
    expectNoRole('button', 'More actions')
  })

  it('sits the removal of an outgoing chip disabled with its reason', async () => {
    renderWithProviders(
      <ItemLinkLine
        projectId="p1"
        links={links}
        lockedReason="Documents cannot change while the agents work."
      />,
    )

    await pressButton('Analysed requirement, Requirement 1')
    await pressButton('More actions')
    expect(await screen.findByRole('menuitem', { name: 'Remove this link' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('has no accessibility violation', async () => {
    const { container } = renderLine()

    await expectNoAccessibilityViolations(container)
  })
})
