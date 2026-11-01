import { http, HttpResponse } from 'msw'

import { outputLanguages, type Project } from '@/features/projects'
import type { FieldProblem } from '@/shared/api/api-error.utils'
import { isUnfinishedRunStatus } from '@/shared/config/run-status.constants'

import definition from '../data/workflow/requirements_engineering.v1.json'
import { mockModels } from '../models/models.fixtures'
import { allRuns } from '../runs/runs.handlers'
import { mockRecord } from '../shared/mock-db.utils'
import { createdId, IdPrefix, USER_ID } from '../shared/mock-ids.constants'
import { answerScenario, mockScenario, pageParam } from '../shared/mock-scenario.utils'
import { paginate } from '../shared/pagination.utils'
import { notFound, problem, validationFailed } from '../shared/problem.utils'
import { bulkProjectCount } from './extra-project-specs.constants'
import { bulkProjects, extraProjects } from './extra-projects.fixtures'
import { mockProjects } from './projects.fixtures'

// Projects created with POST /projects.
const createdProjects = mockRecord<Project[]>('created-projects', () => [])

// What PATCH /projects/{project_id} changed, by project.
const projectEdits = mockRecord<Record<string, Partial<Project>>>('project-edits', () => ({}))

// The unfinished runs of a project, counted by status, as the API derives them.
function withRunCounts(project: Project): Project {
  const counts: Project['unfinished_run_counts'] = { queued: 0, running: 0, interrupted: 0 }
  for (const run of allRuns()) {
    if (run.project_id === project.id && isUnfinishedRunStatus(run.status)) counts[run.status] += 1
  }
  return { ...project, unfinished_run_counts: counts }
}

// With `?mock-projects=many`, the list is long: the projects of the fixtures, and many more.
function allProjects(): Project[] {
  const many = pageParam('mock-projects') === 'many' ? bulkProjects(bulkProjectCount) : []
  const edits = projectEdits.get()
  return [...createdProjects.get(), ...mockProjects, ...extraProjects(), ...many]
    .map((project) => ({ ...project, ...edits[project.id] }))
    .map(withRunCounts)
}

/** A project of the fixtures or one created since. */
export function findProject(projectId: string): Project | undefined {
  return allProjects().find(({ id }) => id === projectId)
}

interface Schema {
  type?: string
  minimum?: number
  maximum?: number
  default?: unknown
}

const parameterSchemas = definition.run_parameters_schema.properties as Record<string, Schema>
const checkpointIds = definition.nodes
  .filter(({ kind }) => kind === 'checkpoint')
  .map(({ id }) => id)
const roleKeys = definition.agent_roles.map(({ key }) => key)

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

function runConfigProblems(config: Record<string, unknown>): FieldProblem[] {
  const problems: FieldProblem[] = []
  const at = (name: string, message: string) =>
    problems.push({ field: `run_config.${name}`, message })
  const checkpoints = config.review_checkpoints
  if (checkpoints !== null && checkpoints !== undefined) {
    if (
      !Array.isArray(checkpoints) ||
      checkpoints.some((id) => !checkpointIds.includes(String(id)))
    ) {
      at('review_checkpoints', 'Choose checkpoints of the workflow.')
    }
  }
  if (config.max_steps !== null && config.max_steps !== undefined) {
    if (!Number.isInteger(config.max_steps) || Number(config.max_steps) < 1) {
      at('max_steps', 'Enter a whole number, 1 or more.')
    }
  }
  if (config.max_cost_usd !== null && config.max_cost_usd !== undefined) {
    if (typeof config.max_cost_usd !== 'number' || config.max_cost_usd <= 0) {
      at('max_cost_usd', 'Enter an amount above 0.')
    }
  }
  const parameters = config.parameters
  if (parameters !== null && parameters !== undefined) {
    if (!isRecord(parameters)) {
      at('parameters', 'Parameters are an object.')
      return problems
    }
    for (const [name, value] of Object.entries(parameters)) {
      const schema = parameterSchemas[name]
      if (schema === undefined) {
        at(`parameters.${name}`, 'The workflow has no such parameter.')
      } else if (
        typeof value !== 'number' ||
        (schema.type === 'integer' && !Number.isInteger(value))
      ) {
        at(`parameters.${name}`, 'Enter a whole number.')
      } else if (value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity)) {
        at(
          `parameters.${name}`,
          `Enter a value from ${String(schema.minimum)} to ${String(schema.maximum)}.`,
        )
      }
    }
    const valueOf = (name: string) => Number(parameters[name] ?? parameterSchemas[name]?.default)
    if (problems.length === 0 && valueOf('max_personas') < valueOf('target_personas_num')) {
      at('parameters.max_personas', 'Must not be lower than target_personas_num.')
    }
  }
  return problems
}

function projectPatchProblems(body: Record<string, unknown>): FieldProblem[] {
  const problems: FieldProblem[] = []
  if ('name' in body && (typeof body.name !== 'string' || body.name.trim() === '')) {
    problems.push({ field: 'name', message: 'Enter a name.' })
  }
  if ('output_language' in body && body.output_language !== 'en' && body.output_language !== 'vi') {
    problems.push({ field: 'output_language', message: 'Choose a language.' })
  }
  if ('status' in body && body.status !== 'active' && body.status !== 'archived') {
    problems.push({ field: 'status', message: 'Choose active or archived.' })
  }
  if ('run_config' in body) {
    if (isRecord(body.run_config)) problems.push(...runConfigProblems(body.run_config))
    else problems.push({ field: 'run_config', message: 'The run settings are an object.' })
  }
  if ('model_overrides' in body) {
    const overrides = body.model_overrides
    if (!isRecord(overrides)) {
      problems.push({ field: 'model_overrides', message: 'The models are an object.' })
    } else {
      for (const [role, model] of Object.entries(overrides)) {
        const entry = mockModels.find(({ model_id }) => model_id === model)
        if (!roleKeys.includes(role)) {
          problems.push({
            field: `model_overrides.${role}`,
            message: 'The workflow has no such role.',
          })
        } else if (!entry?.allowed_roles.includes(role)) {
          problems.push({
            field: `model_overrides.${role}`,
            message: 'This model cannot serve this role.',
          })
        }
      }
    }
  }
  return problems
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

  http.patch('/api/v1/projects/:projectId', async ({ params, request }) => {
    const projectId = String(params.projectId)
    const project = findProject(projectId)
    if (project === undefined) return notFound('The project')
    const body: unknown = await request.json()
    if (!isRecord(body))
      return problem(422, 'validation_failed', 'Validation failed', 'The body is an object.')
    const problems = projectPatchProblems(body)
    if (problems.length > 0) {
      return validationFailed(problems)
    }
    const fields: Partial<Project> = {}
    for (const name of [
      'name',
      'description',
      'status',
      'output_language',
      'run_config',
      'model_overrides',
    ] as const) {
      if (name in body) Object.assign(fields, { [name]: body[name] })
    }
    const edits = projectEdits.get()
    projectEdits.set({
      ...edits,
      [projectId]: { ...edits[projectId], ...fields, updated_at: new Date().toISOString() },
    })
    return HttpResponse.json(findProject(projectId))
  }),
]
