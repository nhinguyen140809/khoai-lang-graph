'use client'

import { createContext, useContext } from 'react'

import { workbenchProjectPages } from '../projects.constants'
import type { ProjectPages } from '../projects.types'

/** Where the pages of the projects are in the frame on show; the workbench, unless a frame says. */
export const ProjectPagesContext = createContext<ProjectPages>(workbenchProjectPages)

/**
 * Where the pages of the projects are in the frame on show, for the parts that every frame places:
 * the dialog that creates a project opens it, and the dialog that cannot delete one leads to it. A
 * frame other than the workbench gives its own pages with `ProjectPagesProvider`.
 */
export function useProjectPages(): ProjectPages {
  return useContext(ProjectPagesContext)
}
