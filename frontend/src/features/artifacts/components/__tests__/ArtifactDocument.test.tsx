import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockArtifactByKind } from '@/mocks/artifacts.fixtures'
import { PROJECT_IDS } from '@/mocks/mock-ids.constants'
import { setPathname } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { ArtifactDocument } from '../ArtifactDocument'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  setPathname('/')
})

function renderDocument(kind: string, title?: string) {
  const artifact = mockArtifactByKind(PROJECT_IDS.mentor, kind, title)
  render(<ArtifactDocument projectId={PROJECT_IDS.mentor} artifactId={artifact.id} />, {
    wrapper: TestProviders,
  })
  return artifact
}

describe('ArtifactDocument', () => {
  it('draws the specification as a document: its fields, then sections with tables of requirements', async () => {
    renderDocument('requirement_specification')

    expect(await screen.findByRole('heading', { name: 'Requirement specification' })).toBeVisible()
    expect(screen.getByText('Help university students find and book mentors.')).toBeVisible()
    const section = await screen.findByRole('heading', { name: /3\.1\s+Mentor discovery/ })
    expect(section).toBeVisible()
    const table = (await screen.findAllByRole('table'))[0]
    if (table === undefined) throw new Error('No table')
    expect(within(table).getByRole('columnheader', { name: 'Verification method' })).toBeVisible()
    expect(within(table).getByRole('link', { name: 'Search mentors' })).toBeVisible()
    expect(within(table).getByText('REQ-002')).toBeVisible()
  })

  it('draws an interview as a transcript, one line for each turn', async () => {
    renderDocument('interview_transcript', 'Interview: PER-001 Student')

    const transcript = await screen.findByRole('list', { name: 'Interview message' })

    expect(within(transcript).getAllByRole('listitem')).toHaveLength(8)
    expect(within(transcript).getByText(/How do you look for a mentor today\?/)).toBeVisible()
  })

  it('draws personas as cards', async () => {
    renderDocument('persona_catalog')

    const cards = await screen.findByRole('list', { name: 'Persona' })

    expect(within(cards).getAllByRole('listitem')).toHaveLength(3)
    expect(within(cards).getByRole('link', { name: 'Student' })).toBeVisible()
  })

  it('shows an error with a retry when the artifact does not exist', async () => {
    render(<ArtifactDocument projectId={PROJECT_IDS.mentor} artifactId="nothing" />, {
      wrapper: TestProviders,
    })

    expect(await screen.findByText('Artifact not found')).toBeVisible()
  })
})
