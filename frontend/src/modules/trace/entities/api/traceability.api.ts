import { apiEndpoints } from '@/shared/api/endpoints'
import { apiRequest } from '@/shared/api/request'

import {
  type Coverage,
  coverageSchema,
  type Matrix,
  matrixSchema,
} from '../types/traceability.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The chains from the backlog down to the interview of a project, one row for each chain. */
export function getTraceabilityMatrix(projectId: string): Promise<Matrix> {
  return apiRequest(apiEndpoints.traceabilityMatrix.path({ projectId }), matrixSchema, {
    action: 'load the traceability matrix',
  })
}

/** The items of a project that need attention: with no backlog item, with no source, out of date. */
export function getTraceabilityCoverage(projectId: string): Promise<Coverage> {
  return apiRequest(apiEndpoints.traceabilityCoverage.path({ projectId }), coverageSchema, {
    action: 'load the coverage',
  })
}
