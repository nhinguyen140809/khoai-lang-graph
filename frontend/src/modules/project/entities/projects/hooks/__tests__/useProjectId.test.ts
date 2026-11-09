import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { ProjectIdProvider } from '../../components/ProjectIdProvider'
import { useProjectId } from '../useProjectId'

/** A wrapper that puts the hook in the screen of each project, outermost first. */
function insideProjects(...projectIds: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return projectIds.reduceRight<ReactNode>(
      (inner, projectId) => createElement(ProjectIdProvider, { projectId, children: inner }),
      children,
    )
  }
}

describe('useProjectId', () => {
  it('gives the id of the project that the provider around it names', () => {
    const { result } = renderHook(() => useProjectId(), { wrapper: insideProjects('project-7') })

    expect(result.current).toBe('project-7')
  })

  it('gives the id of the nearest provider when two are nested', () => {
    const { result } = renderHook(() => useProjectId(), {
      wrapper: insideProjects('outer', 'inner'),
    })

    expect(result.current).toBe('inner')
  })

  it('throws outside the screens of a project, where no project is meant', () => {
    expect(() => renderHook(() => useProjectId())).toThrow(/project of a screen/)
  })
})
