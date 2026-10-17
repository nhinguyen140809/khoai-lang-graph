import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TestProviders } from '@/test/TestProviders'

import { useProject, useRecentProjects } from '../useProjectQueries'

interface Props {
  projectId: string | undefined
}

/** The recent projects, then one project, once `projectId` is given. */
function renderRecentThenProject() {
  const initialProps: Props = { projectId: undefined }
  return renderHook(
    ({ projectId }: Props) => ({ recent: useRecentProjects(), project: useProject(projectId) }),
    { wrapper: TestProviders, initialProps },
  )
}

describe('useProject', () => {
  it('stays idle without a project', async () => {
    const { result } = renderRecentThenProject()

    await waitFor(() => {
      expect(result.current.recent.isSuccess).toBe(true)
    })
    expect(result.current.project.fetchStatus).toBe('idle')
    expect(result.current.project.data).toBeUndefined()
  })

  it('shows at once a project that a list has loaded, and loads it again', async () => {
    const { result, rerender } = renderRecentThenProject()
    await waitFor(() => {
      expect(result.current.recent.isSuccess).toBe(true)
    })

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
