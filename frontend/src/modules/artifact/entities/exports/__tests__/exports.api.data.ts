import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader } from '@/shared/api/http'
import type { SentRequestCase } from '@/test/suites'

import { createExport, listProjectExports } from '../exports.api'
import type { CreateExportBody } from '../exports.types'

const projectId = projectIds.mentor
/** The body that asks for the whole project as JSON, which the template offers. */
export const fullProjectAsJson: CreateExportBody = { template: 'full_project', format: 'json' }

const exportPath = apiEndpoints.projectExports.path({ projectId })

/** A call of the export API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'asks for an export with an idempotency key',
    call: () => createExport(projectId, fullProjectAsJson, 'export-key'),
    request: {
      method: 'POST',
      path: exportPath,
      body: { template: 'full_project', format: 'json' },
      headers: { [HttpHeader.IdempotencyKey]: 'export-key' },
    },
  },
  {
    name: 'lists project exports',
    call: () => listProjectExports(projectId, null, 50),
    request: { method: 'GET', path: `${exportPath}?limit=50`, body: null },
  },
] satisfies SentRequestCase[]

export { projectId }
