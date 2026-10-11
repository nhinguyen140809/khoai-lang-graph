import { http, HttpResponse } from 'msw'

import { mockArtifacts } from './artifacts.fixtures'
import { mockItems } from './items.fixtures'
import { mockLinks } from './links.fixtures'
import { answerScenario, mockScenario } from './mock-scenario.utils'
import { notFound } from './problem.utils'
import { findProject } from './projects.handlers'

export const artifactHandlers = [
  http.get('/api/v1/projects/:projectId/artifacts', async ({ params }) => {
    const scenario = mockScenario('artifacts')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    if (scenario === 'empty') return HttpResponse.json({ items: [], next_cursor: null })
    const artifacts = mockArtifacts.filter((entry) => entry.project_id === projectId)
    return HttpResponse.json({
      items: artifacts,
      next_cursor: null,
    })
  }),

  http.get('/api/v1/artifacts/:artifactId/items', async ({ params, request }) => {
    const scenario = mockScenario('artifact-items')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const artifactId = String(params.artifactId)
    const exists = mockArtifacts.some((entry) => entry.id === artifactId)
    if (!exists) return notFound('The artifact')
    const url = new URL(request.url)
    const kind = url.searchParams.get('kind')
    const items = mockItems.filter(
      (entry) => entry.artifact_id === artifactId && (kind === null || entry.kind === kind),
    )
    return HttpResponse.json({ items, next_cursor: null })
  }),

  http.get('/api/v1/items/:itemId/trace', async ({ params }) => {
    const scenario = mockScenario('item-trace')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const itemId = String(params.itemId)
    const knownItems = mockItems.some((entry) => entry.id === itemId)
    if (!knownItems) return notFound('The item')
    const links = mockLinks.filter((link) => link.source.id === itemId || link.target.id === itemId)
    const nodeIds = new Set<string>()
    for (const link of links) {
      if (link.source.id === itemId) nodeIds.add(link.target.id)
      if (link.target.id === itemId) nodeIds.add(link.source.id)
    }
    const nodes = mockItems
      .filter((entry) => entry.id === itemId || nodeIds.has(entry.id))
      .map((entry) => ({
        id: entry.id,
        key: entry.key,
        kind: entry.kind,
        review_status: entry.review_status,
      }))
    return HttpResponse.json({ nodes, links })
  }),

  http.get('/api/v1/items/:itemId/revisions', async ({ params }) => {
    const scenario = mockScenario('item-revisions')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const itemId = String(params.itemId)
    const item = mockItems.find((entry) => entry.id === itemId)
    if (item === undefined) return notFound('The item')
    const revisions = [
      {
        item_id: itemId,
        version: 1,
        change_reason: 'generated' as const,
        snapshot: item.content,
        created_at: item.updated_at,
      },
    ]
    return HttpResponse.json({ items: revisions, next_cursor: null })
  }),
]
