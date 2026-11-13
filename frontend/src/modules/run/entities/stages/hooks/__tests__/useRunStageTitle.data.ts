import type { RunStatus } from '../../../status/run-status.types'

function runAt(status: RunStatus, stage: string) {
  return { id: 'r1', status, workflow_version: 1, current_stage: stage }
}

/** A run, or none, and the title of the stage that its status names; undefined when it names none. */
export const stageTitleCases: {
  name: string
  run: ReturnType<typeof runAt> | null
  title: string | undefined
}[] = [
  {
    name: 'a run that works',
    run: runAt('running', 'analysis'),
    title: 'Analysing the interviews',
  },
  {
    name: 'a review that waits',
    run: runAt('interrupted', 'analysis_review'),
    title: 'Reviewing the analysis',
  },
  {
    name: 'a run that failed',
    run: runAt('failed', 'analysis'),
    title: 'Analysing the interviews',
  },
  {
    name: 'a run that was stopped',
    run: runAt('cancelled', 'interviewing'),
    title: 'Interviewing',
  },
  { name: 'a run about to start', run: runAt('queued', 'planning'), title: undefined },
  { name: 'a run that is done', run: runAt('succeeded', 'done'), title: undefined },
  { name: 'no run', run: null, title: undefined },
]
