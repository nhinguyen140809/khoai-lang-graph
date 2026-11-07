import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projectIds, runIds } from '@/mocks/shared/db'
import { sleep } from '@/shared/lib/scheduling'
import { openedEventSources } from '@/test/event-source'
import { renderWithProviders } from '@/test/render'

import { ProjectRunStreams } from '../ProjectRunStreams'

describe('ProjectRunStreams', () => {
  it('follows the stream of a thread with an unfinished run', async () => {
    // The mentor platform waits for a review in its main thread.
    const { container } = renderWithProviders(<ProjectRunStreams projectId={projectIds.mentor} />)

    await waitFor(() => {
      expect(openedEventSources()).toHaveLength(1)
    })
    expect(openedEventSources()[0]?.url).toContain(`/runs/${runIds.mentorMain3}/stream`)
    expect(container).toBeEmptyDOMElement()
  })

  it('follows no stream for a thread whose run ended', async () => {
    // The campus project has one run, which is done.
    renderWithProviders(<ProjectRunStreams projectId={projectIds.campus} />)

    await sleep(100)
    expect(openedEventSources()).toHaveLength(0)
  })
})
