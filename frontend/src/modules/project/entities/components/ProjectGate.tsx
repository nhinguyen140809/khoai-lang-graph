'use client'

import type { ReactNode } from 'react'

import { isNotFoundError } from '@/shared/api/error'

import { ProjectIdProvider } from '../projects/components/ProjectIdProvider'
import { useProject } from '../projects/hooks/useProjectQueries'

interface ProjectGateProps {
  projectId: string
  /** Shown instead of the children when the project does not exist. */
  notFound: ReactNode
  children: ReactNode
}

/**
 * Shows the screens of a project unless the project does not exist. While the project loads, or
 * when it fails to load for another reason, each part of the screen shows its own state. The
 * screens it shows read the id of their project with `useProjectId`.
 */
export function ProjectGate({ projectId, notFound, children }: ProjectGateProps) {
  const project = useProject(projectId)
  const isMissing = project.isError && isNotFoundError(project.error)
  return (
    <ProjectIdProvider projectId={projectId}>{isMissing ? notFound : children}</ProjectIdProvider>
  )
}
