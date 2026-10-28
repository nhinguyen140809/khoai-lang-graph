import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { findProject } from '../../projects/projects.lookup'
import { projectNotFound } from '../../projects/projects.problems'
import { pathParam } from '../../shared/http/request'
import { answerScenario } from '../../shared/scenario'
import { coverageOf } from '../lookup/coverage.lookup'
import { matrixOf } from '../lookup/matrix.lookup'
import { matrixColumns } from '../traceability.constants'

/** The endpoints of the views of the traceability of a project. */
export const traceabilityHandlers = [
  http.get(apiEndpoints.traceabilityMatrix.pattern, async ({ params }) => {
    const scenario = await answerScenario('traceability')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    if (scenario === 'empty') return HttpResponse.json({ columns: matrixColumns, rows: [] })
    return HttpResponse.json(matrixOf(projectId))
  }),

  http.get(apiEndpoints.traceabilityCoverage.pattern, async ({ params }) => {
    await answerScenario('traceability')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    return HttpResponse.json(coverageOf(projectId))
  }),
]
