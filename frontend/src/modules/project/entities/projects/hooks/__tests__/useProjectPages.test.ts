import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { userRoutes } from '@/shared/routes'

import { ProjectPagesProvider } from '../../components/ProjectPagesProvider'
import type { ProjectPages } from '../../projects.types'
import { useProjectPages } from '../useProjectPages'

describe('useProjectPages', () => {
  it('opens a project at its activity and starts it on the list of the projects by default', () => {
    const { result } = renderHook(() => useProjectPages())

    expect(result.current.project('p1')).toBe('/projects/p1/activity')
    expect(result.current.start()).toBe('/projects')
  })

  it('gives the pages of the frame that the provider around it names', () => {
    const pages: ProjectPages = { project: userRoutes.project, start: userRoutes.home }
    const { result } = renderHook(() => useProjectPages(), {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(ProjectPagesProvider, { pages, children }),
    })

    expect(result.current).toBe(pages)
  })
})
