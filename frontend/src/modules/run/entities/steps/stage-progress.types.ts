import type { StageSubject } from '@/modules/artifact/entities/@x/run'

import type { WorkStatus } from './run-steps.types'

/** The statuses of a stage or of a subject of a stage, as far as a run went. */
export const stageStatuses = [
  'not_started',
  'running',
  'waiting',
  'done',
  'failed',
  'stopped',
] as const

export type StageStatus = (typeof stageStatuses)[number]

/** A subject of a stage that runs once for each, as far as the run went, such as an interviewee. */
export interface SubjectProgress {
  subject: StageSubject
  /** Its place in the order the run takes the subjects, from 1. */
  number: number
  status: StageStatus
  /** The status of that latest line of work, whose words the panel reads; null before it starts. */
  workStatus: WorkStatus | null
  /** The latest line of work of the stage on the subject, which the chat scrolls to; null before it starts. */
  workId: string | null
  /** How long that line took; null while it runs or before it starts. */
  durationMs: number | null
}

/** A stage of the workflow as far as a run went, with its sub-steps: the stages nested under it, then its subjects. */
export interface StageProgress {
  key: string
  title: string
  /** Its place among the stages of its level, from 1. */
  number: number
  status: StageStatus
  /** Whether it starts open: it is the current stage or holds it. */
  isOpen: boolean
  /** The latest line of work of the stage, which the chat scrolls to; null without work. */
  latestWorkId: string | null
  children: StageProgress[]
  subjects: SubjectProgress[]
}

export type StageProgressResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; stages: StageProgress[] }
