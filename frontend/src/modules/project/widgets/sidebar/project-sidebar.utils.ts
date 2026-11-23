import type { Project } from '@/modules/project/entities'
import { runStatusesByAttention } from '@/modules/run/entities'

/** The place of a project in the list: the place of its status, and after every status without a run. */
function attentionRank({ rollup_run_status: status }: Pick<Project, 'rollup_run_status'>): number {
  return status === null ? runStatusesByAttention.length : runStatusesByAttention.indexOf(status)
}

/**
 * The projects from the one whose status needs the user most, such as a review that waits, to the
 * one that needs them least, and the projects without a run last. Projects with the same status
 * keep their order, the latest activity first as the list gives them.
 */
export function projectsByAttention<P extends Pick<Project, 'rollup_run_status'>>(
  projects: readonly P[],
): P[] {
  return projects.toSorted((first, second) => attentionRank(first) - attentionRank(second))
}
