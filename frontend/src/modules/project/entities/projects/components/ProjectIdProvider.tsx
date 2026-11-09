'use client'

import type { ReactNode } from 'react'

import { ProjectIdContext } from '../hooks/useProjectId'

interface ProjectIdProviderProps {
  projectId: string
  children: ReactNode
}

/** Gives the components of a project screen the id of their project, which `useProjectId` reads. */
export function ProjectIdProvider({ projectId, children }: ProjectIdProviderProps) {
  return <ProjectIdContext value={projectId}>{children}</ProjectIdContext>
}
