import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'
import { waitForQueries } from '@/test/steps'

import { useProject, useRecentProjects } from '../useProjectQueries'

interface ProjectHookProps {
  projectId: string | undefined
}

/** The recent projects, then one project, once `projectId` is given. */
function renderRecentThenProject() {
  const initialProps: ProjectHookProps = { projectId: undefined }
  return renderHookWithProviders(
    ({ projectId }: ProjectHookProps) => ({
      recent: useRecentProjects(),
      project: useProject(projectId),
    }),
    { initialProps },
  )
}

describe('useProject', () => {
  it('stays idle without a project', async () => {
    const { result } = renderRecentThenProject()

    await waitForQueries(() => [result.current.recent])
    expect(result.current.project.fetchStatus).toBe('idle')
    expect(result.current.project.data).toBeUndefined()
  })

  it('shows at once a project that a list has loaded, and loads it again', async () => {
    const { result, rerender } = renderRecentThenProject()
    await waitForQueries(() => [result.current.recent])

    const listed = result.current.recent.data?.[0]?.id

    rerender({ projectId: listed })

    expect(listed).toBeDefined()
    expect(result.current.project.data?.id).toBe(listed)
    expect(result.current.project.isFetching).toBe(true)
    await waitFor(() => {
      expect(result.current.project.isFetching).toBe(false)
    })
  })
})
