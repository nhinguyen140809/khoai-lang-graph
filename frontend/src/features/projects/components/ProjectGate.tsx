'use client'

import type { ReactNode } from 'react'

import { isNotFoundError } from '@/lib/api-fetch.utils'

import { useProject } from '../hooks/useProject'

interface ProjectGateProps {
  projectId: string
  /** Shown instead of the children when the project does not exist. */
  notFound: ReactNode
  children: ReactNode
}

/**
 * Shows the screens of a project unless the project does not exist. While the project loads, or
 * when it fails to load for another reason, each part of the screen shows its own state.
 */
export function ProjectGate({ projectId, notFound, children }: ProjectGateProps) {
  const project = useProject(projectId)
  return project.isError && isNotFoundError(project.error) ? notFound : children
}
