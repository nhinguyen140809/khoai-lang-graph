import { RunStatusBadge } from '@/shared/components/status'
import { noRunLabel } from '@/shared/domain/run-status'
import { useView } from '@/shared/hooks/useView'

import type { Project } from '../../projects.types'

interface ProjectRunCellProps {
  project: Pick<Project, 'rollup_run_status'>
}

/**
 * The status of a project: the status that the latest runs of its threads roll up to, the one
 * that needs the user most. A project without a run reads as muted text, without a badge.
 */
export function ProjectRunCell({ project }: ProjectRunCellProps) {
  const view = useView()
  const status = project.rollup_run_status

  if (status === null) return <span className="text-muted-foreground">{noRunLabel[view]}</span>
  return <RunStatusBadge status={status} />
}
