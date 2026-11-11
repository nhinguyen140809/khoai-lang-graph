import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  it('shows the first document an agent names as a card, with a button for the others', async () => {
    renderWithProviders(
      <MessageEntry message={analyst} projectId={projectIds.mentor} runStatus={null} />,
    )

    // The words of the agent read as Markdown, and name no key of an item.
    expect(screen.getByText('one conflict')).toBeInTheDocument()
    // The analysis it names first, as a card with the version it refers to.
    expect(screen.getByText('Requirements analysis')).toBeInTheDocument()
    expect(screen.getByText('version 4')).toBeInTheDocument()
    // The conflict it found waits behind the button.
    expect(screen.getByRole('button', { name: '+1 item' })).toBeInTheDocument()
    expect(screen.queryByText('Who approves a booking')).not.toBeInTheDocument()
    await expectNoAccessibilityViolations()
  })

  it('opens the others as short rows when the button is pressed, and closes them again', async () => {
    renderWithProviders(
      <MessageEntry message={analyst} projectId={projectIds.mentor} runStatus={null} />,
    )

    await userEvent.click(screen.getByRole('button', { name: '+1 item' }))

    // The conflict, as a row titled by the item, with its kind, key and version beside.
    expect(await screen.findByText('Who approves a booking')).toBeInTheDocument()
    expect(screen.getByText('Disagreement - CONF-001, version 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quick look at CONF-001' })).toBeInTheDocument()
    expect(screen.getByText('Requirements analysis')).toBeInTheDocument()
    await expectNoAccessibilityViolations()

    await userEvent.click(screen.getByRole('button', { name: 'Show fewer' }))

    expect(screen.queryByText('Who approves a booking')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+1 item' })).toBeInTheDocument()
  })

  it('counts the others with the right plural', () => {
    const many = {
      ...analyst,
      artifact_refs: [
        { artifact_id: 'a1', kind: 'analysis', title: 'One', version: 1 },
        { artifact_id: 'a2', kind: 'analysis', title: 'Two', version: 1 },
        { artifact_id: 'a3', kind: 'analysis', title: 'Three', version: 1 },
      ],
      item_refs: [],
    }
    renderWithProviders(
      <MessageEntry message={many} projectId={projectIds.mentor} runStatus={null} />,
    )

    expect(screen.getByRole('button', { name: '+2 items' })).toBeInTheDocument()
  })

  it('shows no button for a message that names one document', () => {
    const one = {
      ...analyst,
      artifact_refs: [{ artifact_id: 'a1', kind: 'analysis', title: 'One', version: 1 }],
      item_refs: [],
    }
    renderWithProviders(
      <MessageEntry message={one} projectId={projectIds.mentor} runStatus={null} />,
    )

    expect(screen.getByText('One')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^\+/ })).not.toBeInTheDocument()
  })

  it('shows the words of the user as plain text, with the note of when the agents read them', () => {
    renderWithProviders(
      <MessageEntry message={pending} projectId={projectIds.mentor} runStatus="running" />,
    )

    expect(screen.getByText('Also ask about group sessions.')).toBeInTheDocument()
    expect(screen.getByText('Will be read after the current step.')).toBeInTheDocument()
  })
})
