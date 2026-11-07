import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { projectIds, threadIds } from '@/mocks/shared/db'
import { buildThread } from '@/mocks/threads/threads.fixtures'
import { apiEndpoints } from '@/shared/api/endpoints'
import { recordRequests } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { ResendButton } from '../ResendButton'

const mentorThread = buildThread({
  id: threadIds.mentorMain,
  project_id: projectIds.mentor,
})

describe('ResendButton', () => {
  it('sends the words of the message again to its thread', async () => {
    const requests = recordRequests()
    renderWithProviders(
      <ResendButton
        content="Also ask about group sessions."
        projectId={projectIds.mentor}
        thread={mentorThread}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => {
      expect(
        requests.some(
          ({ method, path }) =>
            method === 'POST' &&
            path.includes(
              apiEndpoints.threadMessages
                .path({ threadId: threadIds.mentorMain })
                .replace(/^\/api/, ''),
            ),
        ),
      ).toBe(true)
    })
  })

  it('names itself to assistive technology when only its icon shows', async () => {
    renderWithProviders(
      <ResendButton
        content="Also ask about group sessions."
        projectId={projectIds.mentor}
        thread={mentorThread}
        display="icon"
      />,
    )

    expect(screen.getByRole('button', { name: 'Send it again' })).toBeInTheDocument()
    await expectNoAccessibilityViolations()
  })
})
