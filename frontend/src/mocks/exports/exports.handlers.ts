import { http, HttpResponse } from 'msw'

import type { Export } from '@/modules/artifact/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, MediaType } from '@/shared/api/http'

import { artifactRefOf } from '../artifacts/artifact-refs.utils'
import { findProject } from '../projects/projects.lookup'
import { projectNotFound } from '../projects/projects.problems'
import { IdPrefix, mockNow, nextCreatedId, userId } from '../shared/db'
import { idempotent, pathParam, readBodyFields } from '../shared/http/request'
import { accepted, emptyPage, paginate, validationFailed } from '../shared/http/response'
import { answerScenario } from '../shared/scenario'
import { exportFileExtensions } from './exports.constants'
import { exportedArtifacts, fileOf, findExport, withReadyFile } from './exports.lookup'
import { exportNotFound } from './exports.problems'
import { createdExports } from './exports.store'
import { validateNewExport } from './exports.validators'

export const exportHandlers = [
  // A request that starts work answers its idempotency key as the shared helper does: the first
  // answer is kept, a repeat with the same key gets it again, and the same key with another body
  // answers 409.
  http.post(
    apiEndpoints.projectExports.pattern,
    idempotent(async ({ params, request }) => {
      await answerScenario('exports')
      const projectId = pathParam(params, 'projectId')
      if (findProject(projectId) === undefined) return projectNotFound()
      const read = validateNewExport(await readBodyFields(request))
      if ('problems' in read) return validationFailed(read.problems)
      const { template, format } = read
      const exported = exportedArtifacts(projectId, template)
      const entry: Export = {
        id: nextCreatedId(IdPrefix.Export, createdExports),
        project_id: projectId,
        template,
        format,
        status: 'pending',
        file_name: `${template}.${exportFileExtensions[format] ?? format}`,
        requested_by: userId,
        included_artifacts: exported.map(artifactRefOf),
        size_bytes: null,
        download_url: null,
        created_at: mockNow(),
      }
      createdExports.set([entry, ...createdExports.get()])
      return accepted(entry)
    }),
  ),

  http.get(apiEndpoints.projectExports.pattern, async ({ params, request }) => {
    const scenario = await answerScenario('exports')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    return HttpResponse.json(
      paginate(
        createdExports
          .get()
          .filter((entry) => entry.project_id === projectId)
          .map(withReadyFile),
        request,
      ),
    )
  }),

  http.get(apiEndpoints.exportEntry.pattern, async ({ params }) => {
    await answerScenario('exports')
    const entry = findExport(pathParam(params, 'exportId'))
    return entry === undefined ? exportNotFound() : HttpResponse.json(withReadyFile(entry))
  }),

  http.get(apiEndpoints.exportEntryFile.pattern, ({ params }) => {
    const entry = findExport(pathParam(params, 'exportId'))
    if (entry === undefined) return exportNotFound()
    return new HttpResponse(fileOf(entry), {
      headers: {
        [HttpHeader.ContentType]: MediaType.PlainText,
        [HttpHeader.ContentDisposition]: `attachment; filename="${entry.file_name}"`,
      },
    })
  }),
]
