import { describe } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { itShowsQueryStates } from '@/test/suites'

import { useProject } from '../../hooks/useProjectQueries'
import { ProjectGate } from '../ProjectGate'
import { gateCases } from './ProjectGate.data'

/** The screens of a project, which say how far the project query went. */
function Screens({ projectId }: { projectId: string }) {
  const { status } = useProject(projectId)
  return <p>Project screens, {status}</p>
}

describe('ProjectGate', () => {
  itShowsQueryStates({
    renderScreen: ({ projectId }) =>
      renderWithProviders(
        <ProjectGate projectId={projectId} notFound={<p>Project not found</p>}>
          <Screens projectId={projectId} />
        </ProjectGate>,
      ),
    cases: gateCases,
  })
})
