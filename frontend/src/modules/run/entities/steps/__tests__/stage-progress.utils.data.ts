import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'
import type { StageSubject } from '@/modules/artifact/entities'
import type { VisibleStage } from '@/modules/workflow/entities'

/** A stage of the tree, written shortly: children nest under their parent. */
export function stage(key: string, title: string, children: VisibleStage[] = []): VisibleStage {
  return { key, title, children }
}

/** A subject of a stage, with its key as its title. */
export function subject(n: number, key = `PER-00${String(n)}`): StageSubject {
  return { id: `p${String(n)}`, key, title: key }
}

/** A run with the fields the progress reads. */
export function runWith(
  status: 'running' | 'interrupted' | 'failed' | 'succeeded' | 'cancelled',
  currentStage: string,
) {
  return { status, current_stage: currentStage } as const
}

/** The steps of an interview of a subject, in the order the run takes them. */
export function interviewSteps(personaIndex: number, fromSequence: number, isRunning = false) {
  return [0, 1].map((index) =>
    buildStep({
      sequence: fromSequence + index,
      agent_role: index === 0 ? 'interviewer' : 'persona_agent',
      stage: 'interviewing',
      subject_item_id: `p${String(personaIndex)}`,
      status: isRunning && index === 1 ? 'running' : 'succeeded',
      finished_at:
        isRunning && index === 1 ? null : `2026-10-06T08:${String(30 + fromSequence + index)}:00Z`,
      started_at: `2026-10-06T08:${String(30 + fromSequence + index)}:00Z`,
    }),
  )
}

/** The flat look of a stage: its key, its status, and the keys of its sub-steps. */
export interface StageView {
  key: string
  status: string
  number: number
  isOpen: boolean
  children?: StageView[]
  subjects?: { key: string; status: string; number: number }[]
}

/** The tree of stages as the test reads it back: only what the cases check. */
export function viewOf(stage: {
  key: string
  number: number
  status: string
  isOpen: boolean
  children: {
    key: string
    number: number
    status: string
    isOpen: boolean
    children: unknown[]
    subjects: unknown[]
  }[]
  subjects: { subject: StageSubject; number: number; status: string }[]
}): StageView {
  return {
    key: stage.key,
    status: stage.status,
    number: stage.number,
    isOpen: stage.isOpen,
    ...(stage.children.length > 0
      ? { children: stage.children.map((child) => viewOf(child as never)) }
      : {}),
    ...(stage.subjects.length > 0
      ? {
          subjects: stage.subjects.map(({ subject: { key }, number, status }) => ({
            key,
            number,
            status,
          })),
        }
      : {}),
  }
}

// The stages of version 1 of the workflow, as the mock definition gives them, shortened.
export const visibleStages: VisibleStage[] = [
  stage('planning', 'Planning the interviews'),
  stage('persona_generation', 'Proposing the interviewees'),
  stage('persona_review', 'Reviewing the interviewees'),
  stage('interviewing', 'Interviewing'),
  stage('analysis', 'Analysing the interviews'),
  stage('analysis_review', 'Reviewing the analysis'),
]
