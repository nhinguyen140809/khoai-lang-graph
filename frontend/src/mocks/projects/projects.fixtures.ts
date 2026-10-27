import type { Project } from '@/modules/project/entities'

import { projectIds, userId } from '../shared/db'

// Mock projects, after the project of the API examples: an online platform where university
// students find mentors.

function project(fields: Partial<Project> & Pick<Project, 'id' | 'name'>): Project {
  return {
    owner_id: userId,
    description: null,
    status: 'active',
    output_language: 'en',
    run_config: { review_checkpoints: null, max_steps: null, max_cost_usd: null, parameters: null },
    initial_message_id: null,
    model_overrides: {},
    item_counts: {},
    // Derived from the runs by the handlers, which follow the scenarios.
    unfinished_run_counts: { queued: 0, running: 0, interrupted: 0 },
    rollup_run_status: null,
    last_activity_at: '2026-10-01T09:00:00Z',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T09:00:00Z',
    ...fields,
  }
}

/** A project of the mock data with the usual fields; `fields` change what differs. */
export const buildProject = project

export const projectFixtures: Project[] = [
  project({
    id: projectIds.mentor,
    name: 'Mentor platform',
    description: 'Online platform where university students find mentors.',
    run_config: { review_checkpoints: null, max_steps: null, max_cost_usd: 2.0, parameters: null },
    initial_message_id: 'c2a10000-0000-4000-8000-000000000001',
    item_counts: {
      section: 9,
      persona: 3,
      interview_message: 62,
      raw_requirement: 30,
      analyzed_requirement: 24,
      latent_need: 2,
      assumption: 3,
      ambiguity_issue: 3,
      conflict: 1,
      spec_requirement: 18,
      backlog_item: 12,
      validation_issue: 2,
    },
    last_activity_at: '2026-10-06T08:41:12Z',
    created_at: '2026-10-02T08:09:00Z',
    updated_at: '2026-10-06T08:41:12Z',
  }),
  project({
    id: projectIds.campus,
    name: 'Campus food ordering',
    description: 'Students order food from campus canteens and pick it up between classes.',
    initial_message_id: 'c2a10000-0000-4000-8000-000000000002',
    item_counts: {
      section: 8,
      persona: 4,
      interview_message: 88,
      raw_requirement: 41,
      analyzed_requirement: 31,
      latent_need: 3,
      assumption: 4,
      ambiguity_issue: 2,
      conflict: 2,
      spec_requirement: 22,
      backlog_item: 15,
      validation_issue: 1,
    },
    last_activity_at: '2026-10-05T16:20:00Z',
    created_at: '2026-10-05T15:49:30Z',
    updated_at: '2026-10-05T16:20:00Z',
  }),
  project({
    id: projectIds.library,
    name: 'Library booking',
    description: 'Book study rooms and seats in the university library.',
    output_language: 'vi',
    initial_message_id: 'c2a10000-0000-4000-8000-000000000003',
    item_counts: { persona: 2, interview_message: 3 },
    last_activity_at: '2026-10-03T10:12:00Z',
    created_at: '2026-10-03T10:09:30Z',
    updated_at: '2026-10-03T10:12:00Z',
  }),
  project({
    id: projectIds.laundry,
    name: 'Dorm laundry booking',
    status: 'archived',
    initial_message_id: 'c2a10000-0000-4000-8000-000000000004',
    item_counts: {
      section: 5,
      persona: 2,
      interview_message: 40,
      raw_requirement: 18,
      analyzed_requirement: 12,
      spec_requirement: 9,
      backlog_item: 7,
    },
    last_activity_at: '2026-09-20T09:00:00Z',
    created_at: '2026-09-20T08:39:00Z',
    updated_at: '2026-09-20T09:00:00Z',
  }),
]
