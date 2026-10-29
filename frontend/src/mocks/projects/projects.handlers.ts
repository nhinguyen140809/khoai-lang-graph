import { http, HttpResponse } from 'msw'

import type { Project } from '@/modules/project/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import type { FieldProblem } from '@/shared/api/error'

import { validateRunDefaults } from '../runs/runs.validators'
import { createdId, IdPrefix, mockNow } from '../shared/db'
import { hasMatchingParam, pathParam, queryOf, readBodyFields } from '../shared/http/request'
import {
  created,
  emptyPage,
  invalidState,
  noContent,
  paginate,
  validationFailed,
} from '../shared/http/response'
import { choice, isSentButInvalid, requiredText } from '../shared/http/validation'
import { answerScenario, pageUrlParam, pendingForever } from '../shared/scenario'
import { buildProject } from './projects.fixtures'
import { allProjects, changeProject, findProject } from './projects.lookup'
import { projectNotFound } from './projects.problems'
import { createdProjects, deletedProjectIds } from './projects.store'
import { validateNewProject } from './projects.validators'

const projectStatuses: readonly Project['status'][] = ['active', 'archived']

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
  http.get(apiEndpoints.projects.pattern, async ({ request }) => {
    const scenario = await answerScenario('projects')
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const searchParams = queryOf(request)
    if (pageUrlParam('mock-projects') === 'more-loading' && searchParams.has('cursor')) {
      return pendingForever()
    }
    const projects = allProjects()
      .filter((project) => hasMatchingParam(searchParams, 'status', project.status))
      .filter(matchesFilters(searchParams))
      .toSorted((a, b) => b.last_activity_at.localeCompare(a.last_activity_at))
    return HttpResponse.json(paginate(projects, request))
  }),

  http.get(apiEndpoints.project.pattern, async ({ params }) => {
    const scenario = await answerScenario('project')
    const project = scenario === 'empty' ? undefined : findProject(pathParam(params, 'projectId'))
    return project === undefined ? projectNotFound() : HttpResponse.json(project)
  }),

  http.post(apiEndpoints.projects.pattern, async ({ request }) => {
    await answerScenario('create-project')
    // The language that the server takes no longer includes the one chosen.
    if (pageUrlParam('mock-create-project') === 'invalid') {
      return validationFailed([{ field: 'output_language', message: 'Choose a language.' }])
    }
    const read = validateNewProject(await readBodyFields(request))
    if ('problems' in read) return validationFailed(read.problems)
    const now = mockNow()
    const project = buildProject({
      id: createdId(IdPrefix.Project, createdProjects.get().length + 1),
      ...read.project,
      last_activity_at: now,
      created_at: now,
      updated_at: now,
    })
    createdProjects.set([project, ...createdProjects.get()])
    return created(project, apiEndpoints.project.path({ projectId: project.id }))
  }),
  // Takes the name, the status and the run settings, which rename a project, archive it or make it
  // active again, or set the settings that its runs start from.
  http.patch(apiEndpoints.project.pattern, async ({ params, request }) => {
    await answerScenario('update-project')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    const { name, status, run_config: givenRunConfig } = await readBodyFields(request)
    const newName = requiredText(name)
    const newStatus = choice(projectStatuses, status)
    const problems: FieldProblem[] = []
    if (isSentButInvalid(name, requiredText)) {
      problems.push({ field: 'name', message: 'Enter a name.' })
    }
    if (newStatus === undefined && status !== undefined) {
      problems.push({ field: 'status', message: 'Choose active or archived.' })
    }
    const checkedRunConfig =
      givenRunConfig === undefined ? undefined : validateRunDefaults(givenRunConfig)
    if (checkedRunConfig !== undefined && 'problems' in checkedRunConfig) {
      problems.push(...checkedRunConfig.problems)
    }
    if (problems.length > 0) return validationFailed(problems)
    changeProject(projectId, () => ({
      ...(checkedRunConfig !== undefined &&
        'runDefaults' in checkedRunConfig && { run_config: checkedRunConfig.runDefaults }),
      ...(newName !== undefined && { name: newName }),
      ...(newStatus !== undefined && { status: newStatus }),
      updated_at: mockNow(),
    }))
    return HttpResponse.json(findProject(projectId))
  }),

  // A project with a run that is not finished stays until the run is stopped.
  http.delete(apiEndpoints.project.pattern, async ({ params }) => {
    await answerScenario('delete-project')
    const projectId = pathParam(params, 'projectId')
    const project = findProject(projectId)
    if (project === undefined) return projectNotFound()
    if (Object.values(project.unfinished_run_counts).some((count) => count > 0)) {
      return invalidState('Stop the unfinished runs of the project first.')
    }
    deletedProjectIds.set([...deletedProjectIds.get(), projectId])
    return noContent()
  }),
]
