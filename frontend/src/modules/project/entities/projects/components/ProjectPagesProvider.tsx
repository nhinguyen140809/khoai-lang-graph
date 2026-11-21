'use client'

import type { ReactNode } from 'react'

import { ProjectPagesContext } from '../hooks/useProjectPages'
import type { ProjectPages } from '../projects.types'

interface ProjectPagesProviderProps {
  pages: ProjectPages
  children: ReactNode
}

/** Says where the pages of the projects are in the frame under it, which `useProjectPages` reads. */
export function ProjectPagesProvider({ pages, children }: ProjectPagesProviderProps) {
  return <ProjectPagesContext value={pages}>{children}</ProjectPagesContext>
}
