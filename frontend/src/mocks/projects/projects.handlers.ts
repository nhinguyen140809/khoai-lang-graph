import { http, HttpResponse } from 'msw'

import type { Project } from '@/features/projects'
import type { Run } from '@/features/threads'
import type { FieldProblem } from '@/shared/api/api-error.utils'
import { outputLanguages } from '@/shared/domain/output-language'
import { isUnfinishedRunStatus } from '@/shared/domain/run-status'

import { allRuns } from '../runs/runs.handlers'
import { mockRecord } from '../shared/mock-db.utils'
import { createdId, IdPrefix, USER_ID } from '../shared/mock-ids.constants'
import { answerScenario, mockScenario, pageParam } from '../shared/mock-scenario.utils'
import { paginate } from '../shared/pagination.utils'
import { notFound, validationFailed } from '../shared/problem.utils'
import { bulkProjectCount } from './extra-project-specs.constants'
import { bulkProjects, extraProjects } from './extra-projects.fixtures'
import { mockProjects } from './projects.fixtures'

// Projects created with POST /projects.
const createdProjects = mockRecord<Project[]>('created-projects', () => [])

// The unfinished runs of a project, counted by status, as the API derives them.
function withRunCounts(project: Project, runs: Run[]): Project {
  const counts: Project['unfinished_run_counts'] = { queued: 0, running: 0, interrupted: 0 }
  for (const run of runs) {
    if (run.project_id === project.id && isUnfinishedRunStatus(run.status)) counts[run.status] += 1
  }
  return { ...project, unfinished_run_counts: counts }
}

// With `?mock-projects=many`, the list is long: the projects of the fixtures, and many more.
function allProjects(): Project[] {
  const many = pageParam('mock-projects') === 'many' ? bulkProjects(bulkProjectCount) : []
  const runs = allRuns()
  return [...createdProjects.get(), ...mockProjects, ...extraProjects(), ...many].map((project) =>
    withRunCounts(project, runs),
  )
}

/** A project of the fixtures or one created since. */
export function findProject(projectId: string): Project | undefined {
  return allProjects().find(({ id }) => id === projectId)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOutputLanguage(value: unknown): value is Project['output_language'] {
  return (outputLanguages as readonly unknown[]).includes(value)
}

type NewProject = Pick<Project, 'name' | 'description' | 'output_language'>

// The fields of a new project read from the body; a field given wrong reads as undefined.
function readNewProject(body: unknown): { project: NewProject } | { problems: FieldProblem[] } {
  const given = isRecord(body) ? body : {}
  const name =
    typeof given.name === 'string' && given.name.trim() !== '' ? given.name.trim() : undefined
  const description =
    given.description == null
      ? null
      : typeof given.description === 'string'
        ? given.description
        : undefined
  const language =
    given.output_language === undefined
      ? 'en'
      : isOutputLanguage(given.output_language)
        ? given.output_language
        : undefined
  if (name !== undefined && description !== undefined && language !== undefined) {
    return { project: { name, description, output_language: language } }
  }
  const problems: FieldProblem[] = []
  if (name === undefined) problems.push({ field: 'name', message: 'Enter a name.' })
  if (description === undefined) {
    problems.push({ field: 'description', message: 'Enter text, or nothing.' })
  }
  if (language === undefined) {
    problems.push({ field: 'output_language', message: 'Choose a language.' })
  }
  return { problems }
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
    const read = readNewProject(await request.json().catch(() => null))
    if ('problems' in read) return validationFailed(read.problems)
    const now = new Date().toISOString()
    const project: Project = {
      id: createdId(IdPrefix.Project, createdProjects.get().length + 1),
      owner_id: USER_ID,
      ...read.project,
      status: 'active',
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
