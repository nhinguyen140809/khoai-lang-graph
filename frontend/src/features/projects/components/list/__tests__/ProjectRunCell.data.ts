import type { RunStatus } from '@/shared/domain/run-status'

/** The rollup run status of a project, and what its cell says. */
export const runCellCases: { status: RunStatus | null; text: string }[] = [
  { status: 'interrupted', text: 'Waiting for you' },
  { status: 'failed', text: 'Failed' },
  { status: 'running', text: 'Working' },
  { status: 'queued', text: 'Starting' },
  { status: 'cancelled', text: 'Stopped' },
  { status: 'succeeded', text: 'Done' },
  { status: null, text: 'Not started' },
]
