import { http, HttpResponse } from 'msw'

import type { Source, SourceFormat } from '@/modules/source/entities'
import { sourceFormats, sourceMaxBytes } from '@/modules/source/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import { fileExtension } from '@/shared/lib/files'

import { findProject } from '../projects/projects.lookup'
import { projectNotFound } from '../projects/projects.problems'
import { IdPrefix, mockNow, nextCreatedId } from '../shared/db'
import { pathParam, readUploadedFile } from '../shared/http/request'
import {
  created,
  emptyPage,
  errorResponse,
  paginate,
  validationFailed,
} from '../shared/http/response'
import { answerScenario } from '../shared/scenario'
import { createdSources } from './sources.store'

/** The format of a file name, or undefined when it is not one that the API reads. */
function formatOf(name: string): SourceFormat | undefined {
  return sourceFormats.find((format) => format === fileExtension(name))
}

export const sourceHandlers = [
  http.post(apiEndpoints.projectSources.pattern, async ({ params, request }) => {
    await answerScenario('sources')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    const file = await readUploadedFile(request, 'file')
    if (file === null) {
      return validationFailed([{ field: 'file', message: 'Send the file.' }])
    }
    const format = formatOf(file.name)
    if (format === undefined) {
      return errorResponse(
        HttpStatus.UnprocessableContent,
        'unsupported_format',
        'Unsupported format',
        { detail: `Sources are ${sourceFormats.join(', ')} files.` },
      )
    }
    if (file.size > sourceMaxBytes) {
      return errorResponse(HttpStatus.UnprocessableContent, 'too_large', 'File too large', {
        detail: 'A source is at most 10 MB.',
      })
    }
    const source: Source = {
      id: nextCreatedId(IdPrefix.Source, createdSources),
      project_id: projectId,
      title: file.name.replace(/\.[^.]+$/, ''),
      filename: file.name,
      format,
      latest_version: 1,
      created_at: mockNow(),
    }
    createdSources.set([source, ...createdSources.get()])
    return created(source, apiEndpoints.sourceEntry.path({ documentId: source.id }))
  }),

  http.get(apiEndpoints.projectSources.pattern, async ({ params, request }) => {
    const scenario = await answerScenario('sources')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    return HttpResponse.json(
      paginate(
        createdSources.get().filter((source) => source.project_id === projectId),
        request,
      ),
    )
  }),
]
