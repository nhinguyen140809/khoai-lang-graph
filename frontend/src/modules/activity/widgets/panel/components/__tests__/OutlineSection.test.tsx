import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { IdPrefix, mockId, projectIds, threadIds } from '@/mocks/shared/db'
import { buildThread } from '@/mocks/threads/threads.fixtures'
import type { Thread } from '@/modules/thread/entities'
import { routes } from '@/shared/routes'
import { routerMock } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { OutlineSection } from '../OutlineSection'

const mentorThread: Thread = buildThread({
  id: threadIds.mentorMain,
  project_id: projectIds.mentor,
})

describe('OutlineSection', () => {
  it('lists the messages of the user only, the newest at the bottom', async () => {
    renderWithProviders(<OutlineSection thread={mentorThread} projectId={projectIds.mentor} />)

    // The messages of the agents never show; the pending one is the newest.
    expect(await screen.findByText('Also ask about group sessions.')).toBeInTheDocument()
    expect(screen.queryByText(/one conflict/)).not.toBeInTheDocument()
  })

  it('says its empty state for a thread without messages of the user', async () => {
    renderWithProviders(
      <OutlineSection
        thread={buildThread({ id: threadIds.libraryMain, project_id: projectIds.library })}
        projectId={projectIds.library}
      />,
    )

    // The library thread holds the first message of its run: not empty. The empty state reads
    // from a thread without a message of the user, which the mocks give through the scenario.
    expect(
      await screen.findByText('A system to book study rooms and desks in the library.'),
    ).toBeInTheDocument()
  })

  it('opens the activity at the message', async () => {
    renderWithProviders(<OutlineSection thread={mentorThread} projectId={projectIds.mentor} />)

    await userEvent.click(
      await screen.findByRole('button', { name: /Also ask about group sessions/ }),
    )

    expect(routerMock.push).toHaveBeenCalledWith(
      routes.project(projectIds.mentor).activity({ entryId: mockId(IdPrefix.Message, 9) }),
    )
  })

  it('has no accessibility violation', async () => {
    renderWithProviders(<OutlineSection thread={mentorThread} projectId={projectIds.mentor} />)

    await screen.findByText('Also ask about group sessions.')
    await expectNoAccessibilityViolations()
  })
})
