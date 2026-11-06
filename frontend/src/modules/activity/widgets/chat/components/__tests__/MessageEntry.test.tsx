import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { messageFixtures } from '@/mocks/messages/messages.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { assertPresent } from '@/shared/lib/guards'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { MessageEntry } from '../MessageEntry'

// The message of the analyst of the mentor platform, with its refs to the analysis and its conflict.
const analyst = assertPresent(
  messageFixtures.find(({ agent_role }) => agent_role === 'analyst'),
  'The mock data holds the message of the analyst',
)

// The message of the user that the run has not read yet.
const pending = assertPresent(
  messageFixtures.find(({ delivery }) => delivery === 'pending'),
  'The mock data holds a message that is not read yet',
)

describe('MessageEntry', () => {
  it('shows the words of an agent with the document and the item it names as cards', async () => {
    renderWithProviders(
      <MessageEntry message={analyst} projectId={projectIds.mentor} runStatus={null} />,
    )

    // The words of the agent read as Markdown, and name no key of an item.
    expect(screen.getByText('one conflict')).toBeInTheDocument()
    // The analysis it names, as a card with the version it refers to.
    expect(screen.getByText('Requirements analysis')).toBeInTheDocument()
    expect(screen.getByText('version 4')).toBeInTheDocument()
    // The conflict it found, as a card titled by the item, with its kind, key and version beside.
    expect(await screen.findByText('Who approves a booking')).toBeInTheDocument()
    expect(screen.getByText('Disagreement - CONF-001, version 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quick look at CONF-001' })).toBeInTheDocument()
    await expectNoAccessibilityViolations()
  })

  it('shows the words of the user as plain text, with the note of when the agents read them', () => {
    renderWithProviders(
      <MessageEntry message={pending} projectId={projectIds.mentor} runStatus="running" />,
    )

    expect(screen.getByText('Also ask about group sessions.')).toBeInTheDocument()
    expect(screen.getByText('Will be read after the current step.')).toBeInTheDocument()
  })
})
