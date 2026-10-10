import { http, HttpResponse } from 'msw'

import type { CreateProjectBody, Project } from '@/features/projects'

import { mockRecord } from './mock-db.utils'
import { createdId, USER_ID } from './mock-ids.constants'
import { answerScenario, mockRunState, mockScenario } from './mock-scenario.utils'
import { paginate } from './pagination.utils'
import { notFound, problem } from './problem.utils'
import { mockProjects } from './projects.fixtures'
import { mockThreads } from './threads.fixtures'

// Projects created with POST /projects.
const createdProjects = mockRecord<Project[]>('created-projects', () => [])

// The unfinished runs of a project, counted from the unfinished run of each of its threads, as the
// API derives them. Threads created since have no run.
function withRunCounts(project: Project): Project {
  const threads = mockScenario('runs') === 'empty' ? [] : mockThreads(mockRunState())
  const counts = { queued: 0, running: 0, interrupted: 0 }
  for (const thread of threads) {
    if (thread.project_id === project.id && thread.active_run_status !== null) {
      counts[thread.active_run_status] += 1
    }
  }
  return { ...project, unfinished_run_counts: counts }
}

function allProjects(): Project[] {
  return [...createdProjects.get(), ...mockProjects].map(withRunCounts)
}

/** A project of the fixtures or one created since. */
export function findProject(projectId: string): Project | undefined {
  return allProjects().find(({ id }) => id === projectId)
}

function isCreateProjectBody(body: unknown): body is Partial<CreateProjectBody> {
  return typeof body === 'object' && body !== null
}

export const projectHandlers = [
  http.get('/api/v1/projects', async ({ request }) => {
    const scenario = mockScenario('projects')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    if (scenario === 'empty') return HttpResponse.json({ items: [], next_cursor: null })
    const status = new URL(request.url).searchParams.get('status')
    const projects = allProjects()
      .filter((project) => status === null || project.status === status)
      .toSorted((a, b) => b.last_activity_at.localeCompare(a.last_activity_at))
    return HttpResponse.json(paginate(projects, request))
  }),

  http.get('/api/v1/projects/:projectId', async ({ params }) => {
    const scenario = mockScenario('project')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const project = scenario === 'empty' ? undefined : findProject(String(params.projectId))
    return project === undefined ? notFound('The project') : HttpResponse.json(project)
  }),

  http.post('/api/v1/projects', async ({ request }) => {
    const body: unknown = await request.json()
    const fields = isCreateProjectBody(body) ? body : {}
    const name = typeof fields.name === 'string' ? fields.name.trim() : ''
    if (name === '') {
      return problem(422, 'validation_failed', 'Validation failed', 'The name is missing.', [
        { field: 'name', message: 'Enter a name.' },
      ])
    }
    const now = new Date().toISOString()
    const project: Project = {
      id: createdId('90aa', createdProjects.get().length + 1),
      owner_id: USER_ID,
      name,
      description: fields.description ?? null,
      status: 'active',
      output_language: fields.output_language ?? 'en',
      run_config: {
        review_checkpoints: null,
        max_steps: null,
        max_cost_usd: null,
        parameters: null,
      },
      initial_message_id: null,
      model_overrides: {},
      item_counts: {},
      unfinished_run_counts: { queued: 0, running: 0, interrupted: 0 },
      last_activity_at: now,
      created_at: now,
      updated_at: now,
    }
    createdProjects.set([project, ...createdProjects.get()])
    return HttpResponse.json(project, {
      status: 201,
      headers: { Location: `/api/v1/projects/${project.id}` },
    })
  }),
]
