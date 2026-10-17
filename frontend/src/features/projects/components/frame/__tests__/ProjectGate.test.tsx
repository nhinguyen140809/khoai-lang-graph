import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { TestProviders } from '@/test/TestProviders'

import { useProject } from '../../../hooks/useProjectQueries'
import { ProjectGate } from '../ProjectGate'
import { gateCases } from './ProjectGate.data'

/** The screens of a project, which say how far the project query went. */
function Screens({ projectId }: { projectId: string }) {
  const { status } = useProject(projectId)
  return <p>Project screens, {status}</p>
}

describe('ProjectGate', () => {
  it.each(gateCases)('shows $name', async ({ projectId, answer, shows, hides }) => {
    if (answer !== null) server.use(answer())

    render(
      <ProjectGate projectId={projectId} notFound={<p>Project not found</p>}>
        <Screens projectId={projectId} />
      </ProjectGate>,
      { wrapper: TestProviders },
    )

    expect(await screen.findByText(shows)).toBeInTheDocument()
    expect(screen.queryByText(hides)).not.toBeInTheDocument()
  })
})
