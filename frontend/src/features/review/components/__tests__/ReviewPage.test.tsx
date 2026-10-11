import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PROJECT_IDS, RUN_IDS } from '@/mocks/mock-ids.constants'
import { setPathname } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { ReviewPage } from '../ReviewPage'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

beforeEach(() => {
  setPathname('/')
})

function Artifacts({ artifacts }: { artifacts: { title: string; version: number }[] }) {
  return (
    <p>
      Reading {artifacts.map(({ title, version }) => `${title} v${String(version)}`).join(', ')}
    </p>
  )
}

function Console({ afterLog, reviewOpen }: { afterLog: React.ReactNode; reviewOpen: boolean }) {
  return (
    <div>
      <p>Console, review {reviewOpen ? 'open' : 'closed'}</p>
      {afterLog}
    </div>
  )
}

describe('ReviewPage', () => {
  it('puts the artifact under review beside the console, with the review under the last event', async () => {
    render(
      <ReviewPage
        projectId={PROJECT_IDS.mentor}
        runId={RUN_IDS.mentorMain3}
        Artifacts={Artifacts}
        Console={Console}
      />,
      { wrapper: TestProviders },
    )

    expect(await screen.findByText('Reading Requirements analysis v4')).toBeVisible()
    expect(screen.getByText('Console, review open')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Review' })).toBeVisible()
  })

  it('says when the run waits for no review', async () => {
    render(
      <ReviewPage
        projectId={PROJECT_IDS.mentor}
        runId={RUN_IDS.mentorMain1}
        Artifacts={Artifacts}
        Console={Console}
      />,
      { wrapper: TestProviders },
    )

    expect(await screen.findByText('This run waits for no review')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Back to the console' })).toBeVisible()
  })
})
