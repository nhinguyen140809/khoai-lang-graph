import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { PROJECT_IDS } from '@/mocks/mock-ids.constants'
import { server } from '@/mocks/msw-server.setup'
import { TestProviders } from '@/test/TestProviders'

import { ProjectGate } from '../ProjectGate'

function renderGate(projectId: string) {
  render(
    <ProjectGate projectId={projectId} notFound={<p>Project not found</p>}>
      <p>Project screens</p>
    </ProjectGate>,
    { wrapper: TestProviders },
  )
}

describe('ProjectGate', () => {
  it('shows the screens of a project that exists', async () => {
    renderGate(PROJECT_IDS.mentor)

    expect(screen.getByText('Project screens')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.getByText('Project screens')).toBeInTheDocument()
  })

  it('shows the not found state for a project that does not exist', async () => {
    renderGate('missing')

    expect(await screen.findByText('Project not found')).toBeInTheDocument()
    expect(screen.queryByText('Project screens')).not.toBeInTheDocument()
  })

  it('keeps the screens when the project fails to load for another reason', async () => {
    server.use(
      http.get('/api/v1/projects/:projectId', () => new HttpResponse(null, { status: 500 })),
    )
    renderGate(PROJECT_IDS.mentor)

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.getByText('Project screens')).toBeInTheDocument()
  })
})
