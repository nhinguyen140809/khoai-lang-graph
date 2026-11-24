import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { messageFixtures } from '@/mocks/messages/messages.fixtures'
import { ReferenceOpenerProvider } from '@/modules/activity/entities'
import { assertPresent } from '@/shared/lib/guards'
import { renderWithProviders } from '@/test/render'
import {
  expectNoAccessibilityViolations,
  expectNoRole,
  expectNoText,
  expectRole,
  expectText,
  pressRole,
} from '@/test/steps'

import { RefLinks } from '../RefLinks'

// The message of the analyst of the mentor platform, with its refs to the analysis and its conflict.
const analyst = assertPresent(
  messageFixtures.find(({ agent_role }) => agent_role === 'analyst'),
  'The mock data holds the message of the analyst',
)

describe('RefLinks', () => {
  it('shows the first document an agent names as a card, with a line for the others', async () => {
    renderWithProviders(<RefLinks message={analyst} />)

    // The analysis it names first, as a card with the version it refers to.
    await expectText('Requirements analysis')
    await expectText('v4')
    // The conflict it found waits behind the line.
    await expectRole('button', '1 more item')
    expectNoText('Who approves a booking')
    await expectNoAccessibilityViolations()
  })

  it('opens the others as rows of a list when the line is pressed, and closes them again', async () => {
    renderWithProviders(<RefLinks message={analyst} />)

    await pressRole('button', '1 more item')

    // The conflict, as a row titled by the item, with its kind, key and version beside.
    await expectText('Who approves a booking')
    await expectText('Disagreement - CONF-001, version 1')
    await expectRole('button', 'Quick look at CONF-001')
    await expectText('Requirements analysis')
    await expectNoAccessibilityViolations()

    await pressRole('button', '1 more item')

    await waitFor(() => {
      expectNoText('Who approves a booking')
    })
    await expectRole('button', '1 more item')
  })

  it('counts the others with the right plural', async () => {
    const many = {
      ...analyst,
      artifact_refs: [
        { artifact_id: 'a1', kind: 'analysis', title: 'One', version: 1 },
        { artifact_id: 'a2', kind: 'analysis', title: 'Two', version: 1 },
        { artifact_id: 'a3', kind: 'analysis', title: 'Three', version: 1 },
      ],
      item_refs: [],
    }
    renderWithProviders(<RefLinks message={many} />)

    await expectRole('button', '2 more items')
  })

  it('opens the document and the item of a card where the page opens references', async () => {
    const openReference = vi.fn()
    renderWithProviders(
      <ReferenceOpenerProvider opener={openReference}>
        <RefLinks message={analyst} />
      </ReferenceOpenerProvider>,
    )

    await pressRole('button', 'Requirements analysis, version 4')
    await pressRole('button', '1 more item')
    await pressRole('button', 'Quick look at CONF-001')

    const [document, item] = [analyst.artifact_refs[0], analyst.item_refs[0]]
    expect(openReference).toHaveBeenNthCalledWith(1, {
      kind: 'document',
      artifactId: document?.artifact_id,
    })
    expect(openReference).toHaveBeenNthCalledWith(2, { kind: 'item', itemId: item?.item_id })
  })

  it('shows a card that only reads where the page opens no reference', async () => {
    renderWithProviders(<RefLinks message={analyst} />)

    await expectText('Requirements analysis')
    expectNoRole('button', 'Requirements analysis, version 4')
  })

  it('shows no button for a message that names one document', async () => {
    const one = {
      ...analyst,
      artifact_refs: [{ artifact_id: 'a1', kind: 'analysis', title: 'One', version: 1 }],
      item_refs: [],
    }
    renderWithProviders(<RefLinks message={one} />)

    await expectText('One')
    expectNoRole('button', /more items?$/)
  })
})
