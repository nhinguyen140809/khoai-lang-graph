import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ItemLinksResult } from '@/modules/trace/entities'
import { renderWithProviders } from '@/test/render'
import { expectAttribute, expectRole, pressButton } from '@/test/steps'

import { ItemLinkLineBlock } from '../ItemLinks'

const links = {
  state: 'success',
  outgoing: [
    {
      linkType: 'derived_from',
      title: 'Based on',
      rows: [
        {
          link: {
            id: 'l1',
            source_item_id: 'item',
            target_item_id: 'other-1',
            link_type: 'derived_from',
            target_version: 1,
            target_quote: null,
            source_quote: null,
            note: null,
          },
          other: {
            id: 'other-1',
            artifact_id: 'artifact-1',
            key: 'AR-001',
            kind: 'analyzed_requirement',
            version: 1,
            review_status: 'approved' as const,
            content: { title: 'Requirement 1', statement: 'x' },
          },
          kindTitle: 'Analysed requirement',
          title: 'Requirement 1',
          isOutOfDate: false,
        },
      ],
    },
  ],
  incoming: [],
  count: 1,
  fieldMarks: new Map(),
  rowsByLinkId: new Map(),
} satisfies ItemLinksResult

describe('ItemLinkLineBlock', () => {
  it('offers to remove an outgoing link in the menu of its chip', async () => {
    renderWithProviders(<ItemLinkLineBlock projectId="p1" links={links} lockedReason={null} />)

    await pressButton('Analysed requirement, Requirement 1')
    await pressButton('More actions')

    await expectRole('menuitem', 'Remove this link')
    expect(screen.getByRole('menuitem', { name: 'Remove this link' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('sits the removal disabled while the document cannot change', async () => {
    renderWithProviders(
      <ItemLinkLineBlock
        projectId="p1"
        links={links}
        lockedReason="Documents cannot change while the agents work."
      />,
    )

    await pressButton('Analysed requirement, Requirement 1')
    await pressButton('More actions')

    await expectRole('menuitem', 'Remove this link')
    expectAttribute('menuitem', 'Remove this link', 'aria-disabled', 'true')
  })
})
