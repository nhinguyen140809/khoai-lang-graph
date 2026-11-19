import type { Project } from '@/modules/project/entities'

type RankedProject = Pick<Project, 'id' | 'rollup_run_status'>

/** Projects in the order the list gives them, and the order of their ids in the side list. */
export const attentionCases: { name: string; projects: RankedProject[]; order: string[] }[] = [
  { name: 'no project', projects: [], order: [] },
  {
    name: 'a review that waits before a run that failed, a run that works and a run that is done',
    projects: [
      { id: 'done', rollup_run_status: 'succeeded' },
      { id: 'working', rollup_run_status: 'running' },
      { id: 'failed', rollup_run_status: 'failed' },
      { id: 'waiting', rollup_run_status: 'interrupted' },
    ],
    order: ['waiting', 'failed', 'working', 'done'],
  },
  {
    name: 'a project without a run after a run that was stopped',
    projects: [
      { id: 'not-started', rollup_run_status: null },
      { id: 'stopped', rollup_run_status: 'cancelled' },
    ],
    order: ['stopped', 'not-started'],
  },
  {
    name: 'projects with the same status in the order the list gives them',
    projects: [
      { id: 'newer', rollup_run_status: 'succeeded' },
      { id: 'starting', rollup_run_status: 'queued' },
      { id: 'older', rollup_run_status: 'succeeded' },
    ],
    order: ['starting', 'newer', 'older'],
  },
]

/** The status of a project, and the status that its row shows. */
export const noticeableCases: {
  status: Project['rollup_run_status']
  shown: Project['rollup_run_status']
}[] = [
  { status: 'interrupted', shown: 'interrupted' },
  { status: 'failed', shown: 'failed' },
  { status: 'running', shown: 'running' },
  { status: 'queued', shown: 'queued' },
  { status: 'cancelled', shown: null },
  { status: 'succeeded', shown: null },
  { status: null, shown: null },
]
