import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { findProject } from '../../projects/projects.lookup'
import { projectNotFound } from '../../projects/projects.problems'
import {
  hasMatchingParam,
  pathParam,
  queryOf,
  readBodyFields,
  requestedVersion,
} from '../../shared/http/request'
import { emptyPage, paginate, validationFailed } from '../../shared/http/response'
import { answerScenario } from '../../shared/scenario'
import { artifactKindFixtures, findKind } from '../../workflow/artifact-kinds.fixtures'
import { changeArtifact, changeItem } from '../artifacts.changes'
import {
  allArtifacts,
  artifactRevisions,
  atVersion,
  findArtifact,
  itemRevisionAtArtifactVersion,
  itemsWithDeleted,
} from '../artifacts.lookup'
import {
  artifactNotFound,
  invalidRestoreVersion,
  refuseChange,
  refuseOutsideReview,
  versionNotFound,
} from '../artifacts.problems'
import { contentProblems, validateArtifactChange } from '../artifacts.validators'

// The artifact kinds are listed in the order of the stages that make them.
const kindOrder = artifactKindFixtures.artifact_kinds.map(({ kind }) => kind)

export const artifactHandlers = [
  http.get(apiEndpoints.projectArtifacts.pattern, async ({ params, request }) => {
    const scenario = await answerScenario('artifacts')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const query = queryOf(request)
    const artifacts = allArtifacts()
      .filter((artifact) => artifact.project_id === projectId)
      .filter((artifact) => hasMatchingParam(query, 'kind', artifact.kind))
      .filter((artifact) => hasMatchingParam(query, 'review_status', artifact.review_status))
      .toSorted(
        (a, b) =>
          kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind) ||
          a.created_at.localeCompare(b.created_at),
      )
    return HttpResponse.json(paginate(artifacts, request))
  }),

  http.get(apiEndpoints.artifact.pattern, async ({ params, request }) => {
    await answerScenario('artifact')
    const artifact = findArtifact(pathParam(params, 'artifactId'))
    if (artifact === undefined) return artifactNotFound()
    const found = atVersion(artifact, artifactRevisions(artifact), requestedVersion(request))
    return found === undefined ? versionNotFound() : HttpResponse.json(found)
  }),

  http.patch(apiEndpoints.artifact.pattern, async ({ params, request }) => {
    await answerScenario('update-artifact')
    const artifact = findArtifact(pathParam(params, 'artifactId'))
    if (artifact === undefined) return artifactNotFound()
    const refused = refuseChange(request, artifact, artifact.id)
    if (refused !== null) return refused
    const read = validateArtifactChange(await readBodyFields(request))
    if ('problems' in read) return validationFailed(read.problems)
    const { change } = read
    const content = { ...artifact.content, ...change.content }
    const schema = findKind(artifact.kind)?.schema
    const problems =
      schema === undefined ? [] : contentProblems(schema, content, artifact.project_id)
    if (problems.length > 0) return validationFailed(problems)
    changeArtifact(artifact, { ...change, content }, 'user_edit')
    return HttpResponse.json(findArtifact(artifact.id))
  }),

  http.get(apiEndpoints.artifactRevisions.pattern, async ({ params, request }) => {
    await answerScenario('artifact')
    await answerScenario('revisions')
    const artifact = findArtifact(pathParam(params, 'artifactId'))
    return artifact === undefined
      ? artifactNotFound()
      : HttpResponse.json(paginate(artifactRevisions(artifact), request))
  }),

  // The mock gives the artifact the content of the version and, like the API, each item that the
  // artifact held then the content it had, each as a new version. An item added since stays as it is.
  http.post(apiEndpoints.artifactRestore.pattern, async ({ params, request }) => {
    await answerScenario('restore-artifact')
    const artifact = findArtifact(pathParam(params, 'artifactId'))
    if (artifact === undefined) return artifactNotFound()
    const refused = refuseOutsideReview(artifact.project_id, artifact.id)
    if (refused !== null) return refused
    const { version } = await readBodyFields(request)
    const target = artifactRevisions(artifact).find((entry) => entry.version === version)
    if (target === undefined) return invalidRestoreVersion()
    for (const item of itemsWithDeleted().filter(
      ({ artifact_id }) => artifact_id === artifact.id,
    )) {
      const itemTarget = itemRevisionAtArtifactVersion(item, artifact.id, target.version)
      if (itemTarget !== undefined) {
        changeItem(item, { content: itemTarget.content, deleted: false }, 'restored')
      }
    }
    changeArtifact(artifact, { content: target.content }, 'restored')
    return HttpResponse.json(findArtifact(artifact.id))
  }),
]
