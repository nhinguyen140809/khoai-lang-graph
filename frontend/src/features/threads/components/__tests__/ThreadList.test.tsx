import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { PROJECT_IDS, THREAD_IDS } from '@/mocks/shared/mock-ids.constants'
import { setPathname } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { ThreadList } from '../ThreadList'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

const mainThreadHref = `/projects/${PROJECT_IDS.mentor}/console/${THREAD_IDS.mentorMain}`

beforeEach(() => {
  setPathname(mainThreadHref)
})

describe('ThreadList', () => {
  it('lists the consoles with the stage of their latest run and the reviews waiting', async () => {
    render(<ThreadList projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const main = await screen.findByRole('link', { name: /Main thread/ })
    expect(main).toHaveAttribute('href', mainThreadHref)
    expect(main).toHaveAttribute('aria-current', 'page')
    expect(main).toHaveTextContent('analysis_review')
    expect(await screen.findByRole('link', { name: /1 review waiting/ })).toBe(main)
  })

  it('names a thread that has no title yet', async () => {
    server.use(
      http.get('/api/v1/projects/:projectId/threads', () =>
        HttpResponse.json({
          items: [
            {
              id: 't-new',
              project_id: PROJECT_IDS.mentor,
              created_by: 'u1',
              title: null,
              status: 'active',
              current_stage: null,
              active_run_id: null,
              active_run_status: null,
              last_message_at: '2026-10-10T08:00:00Z',
              created_at: '2026-10-10T08:00:00Z',
              updated_at: '2026-10-10T08:00:00Z',
            },
          ],
          next_cursor: null,
        }),
      ),
    )
    render(<ThreadList projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const thread = await screen.findByRole('link', { name: /New console/ })
    expect(thread).toHaveTextContent('No run yet')
  })

  it('shows the empty state', async () => {
    server.use(
      http.get('/api/v1/projects/:projectId/threads', () =>
        HttpResponse.json({ items: [], next_cursor: null }),
      ),
    )
    render(<ThreadList projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    expect(await screen.findByText('No consoles yet')).toBeInTheDocument()
  })
})
