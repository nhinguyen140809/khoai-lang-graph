import type { Project } from '@/modules/project/entities'
import { noRunLabel, RunStatusBadge } from '@/modules/run/entities'
import { useWording } from '@/shared/lib/view'

interface ProjectRunCellProps {
  project: Pick<Project, 'rollup_run_status'>
}

/**
 * The status of a project: the status that the latest runs of its threads roll up to, the one
 * that needs the user most. A project without a run reads as muted text, without a badge.
 */
export function ProjectRunCell({ project }: ProjectRunCellProps) {
  const noRun = useWording(noRunLabel)
  const status = project.rollup_run_status

  if (status === null) return <span className="text-muted-foreground">{noRun}</span>
  return <RunStatusBadge status={status} />
}
