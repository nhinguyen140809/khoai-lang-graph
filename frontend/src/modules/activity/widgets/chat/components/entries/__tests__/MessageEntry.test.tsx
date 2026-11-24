import { describe, it } from 'vitest'

import { messageFixtures } from '@/mocks/messages/messages.fixtures'
import { assertPresent } from '@/shared/lib/guards'
import { renderWithProviders } from '@/test/render'
import { expectText } from '@/test/steps'

import { MessageEntry } from '../MessageEntry'

// The message of the user that the run has not read yet.
const pending = assertPresent(
  messageFixtures.find(({ delivery }) => delivery === 'pending'),
  'The mock data holds a message that is not read yet',
)

describe('MessageEntry', () => {
  it('shows the words of the user as plain text, with the note of when the agents read them', async () => {
    renderWithProviders(<MessageEntry message={pending} runStatus="running" />)

    await expectText('Also ask about group sessions.')
    await expectText('Will be read after the current step.')
  })
})
