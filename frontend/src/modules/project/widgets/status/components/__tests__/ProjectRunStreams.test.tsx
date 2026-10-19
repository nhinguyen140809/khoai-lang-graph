import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PROJECT_IDS, RUN_IDS } from '@/mocks/shared/mock-ids.constants'
import { openedEventSources } from '@/test/event-source.utils'
import { TestProviders } from '@/test/TestProviders'

import { ProjectRunStreams } from '../ProjectRunStreams'

describe('ProjectRunStreams', () => {
  it('follows the unfinished run of each thread, and no ended run', async () => {
    // The mentor platform waits for a review in its main thread; its other run was stopped.
    const { container } = render(<ProjectRunStreams projectId={PROJECT_IDS.mentor} />, {
      wrapper: TestProviders,
    })

    await waitFor(() => {
      expect(openedEventSources()).toHaveLength(1)
    })
    expect(openedEventSources()[0]?.url).toContain(`/runs/${RUN_IDS.mentorMain3}/stream`)
    expect(container).toBeEmptyDOMElement()
  })
})
