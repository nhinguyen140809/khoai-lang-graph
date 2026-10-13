'use client'

import { useMemo } from 'react'

import { StatusBarSide, useStatusBarItem } from '@/shared/components/frame'

import { ProjectRunStatus } from './ProjectRunStatus'

interface ProjectRunStatusItemProps {
  projectId: string
}

/** Shows the run of the project at the left of the status bar while it is mounted. */
export function ProjectRunStatusItem({ projectId }: ProjectRunStatusItemProps) {
  const content = useMemo(() => <ProjectRunStatus projectId={projectId} />, [projectId])

  useStatusBarItem({ side: StatusBarSide.Left, content })

  return null
}
