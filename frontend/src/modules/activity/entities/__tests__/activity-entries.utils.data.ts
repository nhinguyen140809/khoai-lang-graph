import { buildMessage as buildThreadMessage } from '@/mocks/messages/messages.fixtures'
import { buildRun, buildStep } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import type { Run, RunStep } from '@/modules/run/entities'
import { workEntries } from '@/modules/run/entities'
import type { Message } from '@/modules/thread/entities'

export const run: Run = buildRun({
  id: runIds.mentorMain3,
  thread_id: threadIds.mentorMain,
  project_id: projectIds.mentor,
  number: 3,
  status: 'interrupted',
  current_stage: 'analysis_review',
})

export const steps: RunStep[] = [
  buildStep({
    sequence: 1,
    agent_role: 'planner',
    stage: 'planning',
    started_at: '2026-10-06T08:30:01Z',
    finished_at: '2026-10-06T08:30:10Z',
  }),
  buildStep({
    sequence: 2,
    agent_role: 'intent_router',
    stage: 'intent_routing',
    started_at: '2026-10-06T08:30:10Z',
    finished_at: '2026-10-06T08:30:12Z',
  }),
]

export const messages: Message[] = [
  buildThreadMessage({
    id: 'm1',
    thread_id: threadIds.mentorMain,
    sequence: 1,
    run_id: runIds.mentorMain3,
    content: 'Try a design that suits both the student and the admin.',
    delivery: 'started_run',
    created_at: '2026-10-06T08:30:00Z',
  }),
]

/** The work lines of the steps above, as the entries read them. */
export const work = workEntries(steps, run)

/** The titles the entries read, by key. */
export const stageTitles = new Map([
  ['planning', 'Planning the interviews'],
  ['analysis', 'Analysing the interviews'],
])

export const subjectTitles = new Map<string, string>()
export const kindTitles = new Map<string, string>()
