import { http, HttpResponse } from 'msw'

import type { Project } from '@/modules/project/entities'
import { isUnfinishedRunStatus, type Run } from '@/modules/run/entities'
import type { FieldProblem } from '@/shared/api/error/api-error.utils'
import { outputLanguages } from '@/shared/config/output-language'

import { generatedProjects, manyProjects } from '../generated/fixtures/generated-projects.fixtures'
import { manyProjectCount } from '../generated/generated.constants'
import { allRuns } from '../runs/handlers/runs.handlers'
import { IdPrefix } from '../shared/db/mock-ids.constants'
import { createdId } from '../shared/db/mock-ids.utils'
import { mockState } from '../shared/db/mock-state.utils'
import { readBodyFields } from '../shared/http/request/request-body.utils'
import {
  invalidState,
  notFound,
  validationFailed,
} from '../shared/http/response/error-response.utils'
import { emptyPage, paginate } from '../shared/http/response/pagination.utils'
import {
  addressParam,
  answerScenario,
  pendingForever,
} from '../shared/scenario/mock-scenario.utils'
import { buildProject, projectFixtures } from './projects.fixtures'
import { rollupRunStatus } from './run-status-rollup.utils'

// Projects created with POST /projects.
const createdProjects = mockState<Project[]>('created-projects', () => [])
// The fields of a project changed since, by its id, such as the status that PATCH sets.
const projectChanges = mockState<Record<string, Partial<Project>>>('project-changes', () => ({}))
// The projects that DELETE removed. The API keeps them, but no request finds them again.
const deletedProjectIds = mockState<string[]>('deleted-projects', () => [])

// The unfinished runs of a project, counted by status, and the status of its latest run, as the
// API derives them. A run that has not started yet is the latest.
function withRunCounts(project: Project, runs: Run[]): Project {
  const counts: Project['unfinished_run_counts'] = { queued: 0, running: 0, interrupted: 0 }
  const own = runs.filter((run) => run.project_id === project.id)
  for (const run of own) {
    if (isUnfinishedRunStatus(run.status)) counts[run.status] += 1
  }
  // The latest run of each thread: a run that a later run of its thread replaced no longer counts.
  const latestOfThread = new Map<string, Run>()
  for (const run of own) {
    const latest = latestOfThread.get(run.thread_id)
    if (latest === undefined || run.number > latest.number) latestOfThread.set(run.thread_id, run)
  }
  return {
    ...project,
    unfinished_run_counts: counts,
    rollup_run_status: rollupRunStatus([...latestOfThread.values()].map(({ status }) => status)),
  }
}

// The values of `mock-projects` that make the list long: the projects of the fixtures, and many
// more. With `more-loading`, a page after the first never answers.
const longListScenarios = ['many', 'more-loading']

function allProjects(): Project[] {
  const long = longListScenarios.includes(addressParam('mock-projects') ?? '')
  const many = long ? manyProjects(manyProjectCount) : []
  const runs = allRuns()
  const changes = projectChanges.get()
  const deleted = deletedProjectIds.get()
  return [...createdProjects.get(), ...projectFixtures, ...generatedProjects(), ...many]
    .filter(({ id }) => !deleted.includes(id))
    .map((project) => withRunCounts({ ...project, ...changes[project.id] }, runs))
}

/** A project of the fixtures or one created since. */
export function findProject(projectId: string): Project | undefined {
  return allProjects().find(({ id }) => id === projectId)
}

/** Changes a project of the fixtures or one created since; a project that is not found stays so. */
export function changeProject(projectId: string, change: (project: Project) => Partial<Project>) {
  const project = findProject(projectId)
  if (project === undefined) return
  const changes = projectChanges.get()
  projectChanges.set({ ...changes, [projectId]: { ...changes[projectId], ...change(project) } })
}

const projectStatuses: readonly Project['status'][] = ['active', 'archived']

function isProjectStatus(value: unknown): value is Project['status'] {
  return (projectStatuses as readonly unknown[]).includes(value)
}

function isOutputLanguage(value: unknown): value is Project['output_language'] {
  return (outputLanguages as readonly unknown[]).includes(value)
}

// A text field that may be left out: null when it is left out, undefined when it is not text.
function optionalText(value: unknown): string | null | undefined {
  if (value == null) return null
  return typeof value === 'string' ? value : undefined
}

type NewProject = Pick<Project, 'name' | 'description' | 'output_language'>

// The fields of a new project read from the body; a field given wrong reads as undefined. A name
// left out or blank is null: the agents name the project from its first message.
function readNewProject(
  given: Record<string, unknown>,
): { project: NewProject } | { problems: FieldProblem[] } {
  const givenName = optionalText(given.name)
  const name = typeof givenName === 'string' ? givenName.trim() || null : givenName
  const description = optionalText(given.description)
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
  if (name === undefined) problems.push({ field: 'name', message: 'Enter text, or nothing.' })
  if (description === undefined) {
    problems.push({ field: 'description', message: 'Enter text, or nothing.' })
  }
  if (language === undefined) {
    problems.push({ field: 'output_language', message: 'Choose a language.' })
  }
  return { problems }
}

// The filters of GET /projects, as the API applies them: a rollup run status given one or more
// times matches any of them, `none` a project without a run; `last_activity_after` keeps the
// projects with activity after that time.
function matchesFilters(params: URLSearchParams) {
  const runStatuses = params.getAll('rollup_run_status')
  const after = params.get('last_activity_after')
  return (project: Project) =>
    (runStatuses.length === 0 || runStatuses.includes(project.rollup_run_status ?? 'none')) &&
    (after === null || Date.parse(project.last_activity_at) > Date.parse(after))
}

export const projectHandlers = [
  http.get('/api/v1/projects', async ({ request }) => {
    const scenario = await answerScenario('projects')
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const { searchParams } = new URL(request.url)
    if (addressParam('mock-projects') === 'more-loading' && searchParams.has('cursor')) {
      return pendingForever()
    }
    const status = searchParams.get('status')
    const projects = allProjects()
      .filter((project) => status === null || project.status === status)
      .filter(matchesFilters(searchParams))
      .toSorted((a, b) => b.last_activity_at.localeCompare(a.last_activity_at))
    return HttpResponse.json(paginate(projects, request))
  }),

  http.get('/api/v1/projects/:projectId', async ({ params }) => {
    const scenario = await answerScenario('project')
    const project = scenario === 'empty' ? undefined : findProject(String(params.projectId))
    return project === undefined ? notFound('The project') : HttpResponse.json(project)
  }),

  http.post('/api/v1/projects', async ({ request }) => {
    await answerScenario('create-project')
    // The language that the server takes no longer includes the one chosen.
    if (addressParam('mock-create-project') === 'invalid') {
      return validationFailed([{ field: 'output_language', message: 'Choose a language.' }])
    }
    const read = readNewProject(await readBodyFields(request))
    if ('problems' in read) return validationFailed(read.problems)
    const now = new Date().toISOString()
    const project = buildProject({
      id: createdId(IdPrefix.Project, createdProjects.get().length + 1),
      ...read.project,
      last_activity_at: now,
      created_at: now,
      updated_at: now,
    })
    createdProjects.set([project, ...createdProjects.get()])
    return HttpResponse.json(project, {
      status: 201,
      headers: { Location: `/api/v1/projects/${project.id}` },
    })
  }),
  // Takes the name and the status, which rename a project, archive it or make it active again.
  http.patch('/api/v1/projects/:projectId', async ({ params, request }) => {
    await answerScenario('update-project')
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    const { name, status } = await readBodyFields(request)
    const newName = typeof name === 'string' ? name.trim() : name
    const problems: FieldProblem[] = []
    if (newName !== undefined && (typeof newName !== 'string' || newName === '')) {
      problems.push({ field: 'name', message: 'Enter a name.' })
    }
    if (status !== undefined && !isProjectStatus(status)) {
      problems.push({ field: 'status', message: 'Choose active or archived.' })
    }
    if (problems.length > 0) return validationFailed(problems)
    changeProject(projectId, () => ({
      ...(typeof newName === 'string' && { name: newName }),
      ...(isProjectStatus(status) && { status }),
      updated_at: new Date().toISOString(),
    }))
    return HttpResponse.json(findProject(projectId))
  }),

  // A project with a run that is not finished stays until the run is stopped.
  http.delete('/api/v1/projects/:projectId', async ({ params }) => {
    await answerScenario('delete-project')
    const projectId = String(params.projectId)
    const project = findProject(projectId)
    if (project === undefined) return notFound('The project')
    if (Object.values(project.unfinished_run_counts).some((count) => count > 0)) {
      return invalidState('Stop the unfinished runs of the project first.')
    }
    deletedProjectIds.set([...deletedProjectIds.get(), projectId])
    return new HttpResponse(null, { status: 204 })
  }),
]
