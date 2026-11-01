import { http, HttpResponse } from 'msw'

import type { Artifact, ArtifactItem, Export, Revision, Trace } from '@/features/artifacts'
import { fieldViews, validateContent } from '@/features/artifacts'

import definition from '../data/workflow/requirements_engineering.v1.json'
import { findProject } from '../projects/projects.handlers'
import { allRuns } from '../runs/runs.handlers'
import { createdId, IdPrefix, USER_ID } from '../shared/mock-ids.constants'
import { answerScenario, mockScenario } from '../shared/mock-scenario.utils'
import { paginate } from '../shared/pagination.utils'
import { notFound, problem, validationFailed } from '../shared/problem.utils'
import { mockArtifactKinds } from './artifact-kinds.fixtures'
import { mockArtifactItems, mockArtifacts, mockTraceLinks } from './artifacts.fixtures'
import { artifactStatuses, createdExports, type ItemEdit, itemEdits } from './mock-artifacts.store'

const userOrigin = {
  actor: 'user',
  agent_role: null,
  user_id: USER_ID,
  run_id: null,
  step_id: null,
} as const

const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z')

/** An item with what the user changed in it. */
function current(item: ArtifactItem): ArtifactItem {
  const edit = itemEdits.get()[item.id]
  if (edit === undefined) return item
  return {
    ...item,
    version: edit.version,
    content: edit.content,
    review_status: (edit.review_status ?? item.review_status) as ArtifactItem['review_status'],
    updated_by: userOrigin,
    updated_at: edit.updated_at,
  }
}

/** An artifact with the status that an approval gave it. */
function currentArtifact(artifact: Artifact): Artifact {
  const status = artifactStatuses.get()[artifact.id]
  return status === undefined
    ? artifact
    : { ...artifact, review_status: status as Artifact['review_status'] }
}

export function allItems(): ArtifactItem[] {
  return mockArtifactItems.map(current)
}

function findItem(itemId: string): ArtifactItem | undefined {
  return allItems().find(({ id }) => id === itemId)
}

function depthOf(item: ArtifactItem, byId: Map<string, ArtifactItem>): number {
  let depth = 1
  let parent = item.parent_item_id
  while (parent !== null) {
    depth += 1
    parent = byId.get(parent)?.parent_item_id ?? null
  }
  return depth
}

/** The revisions of an item, newest first: what the user made, then the ones of the fixtures. */
function revisionsOf(item: ArtifactItem): Revision[] {
  const base = mockArtifactItems.find(({ id }) => id === item.id)
  if (base === undefined) return []
  const edit = itemEdits.get()[item.id]
  const fromFixtures: Revision[] = Array.from({ length: base.version }, (_, index) => {
    const version = base.version - index
    return {
      version,
      change_reason: version === 1 ? 'generated' : 'rework',
      changed_by: base.created_by,
      created_at: base.created_at,
      content: base.content,
    } satisfies Revision
  })
  return [...(edit?.history ?? []), ...fromFixtures]
}

function projectOfRunning(projectId: string): boolean {
  return allRuns().some((run) => run.project_id === projectId && run.status === 'running')
}

function ifMatch(request: Request): number | null {
  const header = request.headers.get('If-Match')
  if (header === null) return null
  const version = Number(header.replaceAll('"', ''))
  return Number.isInteger(version) ? version : null
}

function saveEdit(item: ArtifactItem, edit: Omit<ItemEdit, 'history'>, revision: Revision) {
  const edits = itemEdits.get()
  itemEdits.set({
    ...edits,
    [item.id]: { ...edit, history: [revision, ...(edits[item.id]?.history ?? [])] },
  })
}

// The chain of an item through the trace links, `depth` links away at most.
function traceOf(item: ArtifactItem, direction: string, depth: number): Trace {
  const byId = new Map(allItems().map((entry) => [entry.id, entry]))
  const seen = new Set<string>([item.id])
  const linkIds = new Set<string>()
  let frontier = [item.id]
  for (let step = 0; step < depth && frontier.length > 0; step += 1) {
    const next: string[] = []
    for (const link of mockTraceLinks) {
      const backward = direction !== 'forward' && frontier.includes(link.source_item_id)
      const forward = direction !== 'backward' && frontier.includes(link.target_item_id)
      if (!backward && !forward) continue
      linkIds.add(link.id)
      const other = backward ? link.target_item_id : link.source_item_id
      if (!seen.has(other)) {
        seen.add(other)
        next.push(other)
      }
    }
    frontier = next
  }
  const nodes = [...seen].flatMap((id) => {
    const node = byId.get(id)
    return node === undefined
      ? []
      : [
          {
            id: node.id,
            artifact_id: node.artifact_id,
            key: node.key,
            kind: node.kind,
            version: node.version,
            review_status: node.review_status,
            content: node.content,
          },
        ]
  })
  return { nodes, links: mockTraceLinks.filter(({ id }) => linkIds.has(id)) }
}

// The file of an export: the artifacts of its template as text.
function fileOf(entry: Export): string {
  const template = definition.export_templates.find(({ key }) => key === entry.template)
  const kinds = template?.artifact_kinds ?? []
  const artifacts = mockArtifacts.filter(
    (artifact) => artifact.project_id === entry.project_id && kinds.includes(artifact.kind),
  )
  const lines = artifacts.flatMap((artifact) => [
    `# ${artifact.title}`,
    '',
    ...allItems()
      .filter((item) => item.artifact_id === artifact.id)
      .map((item) => `- ${item.key}: ${JSON.stringify(item.content)}`),
    '',
  ])
  return entry.format === 'json'
    ? JSON.stringify(artifacts, null, 2)
    : [`Export: ${entry.template}`, '', ...lines].join('\n')
}

/** An export as the API serves it: it is ready a moment after it was asked for. */
function served(entry: Export): Export {
  const ready = Date.now() - Date.parse(entry.created_at) > 1500
  if (!ready) return entry
  return {
    ...entry,
    status: 'ready',
    size_bytes: fileOf(entry).length,
    download_url: `/api/v1/exports/${entry.id}/file`,
  }
}

export const artifactHandlers = [
  http.get('/api/v1/workflow/definition', () => HttpResponse.json(definition)),

  http.get('/api/v1/content-schemas/:kind/:version', ({ params }) => {
    const kinds = mockArtifactKinds.artifact_kinds.flatMap((artifact) => [
      artifact,
      ...artifact.item_kinds,
    ])
    const found = kinds.find(({ kind }) => kind === params.kind)
    return found === undefined ? notFound('The content schema') : HttpResponse.json(found.schema)
  }),

  http.get('/api/v1/projects/:projectId/artifacts', async ({ params, request }) => {
    const scenario = mockScenario('artifacts')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    if (scenario === 'empty') return HttpResponse.json({ items: [], next_cursor: null })
    const query = new URL(request.url).searchParams
    const kinds = definition.artifact_kinds.map(({ kind }) => kind)
    const artifacts = mockArtifacts
      .map(currentArtifact)
      .filter((artifact) => artifact.project_id === projectId)
      .filter((artifact) => query.get('kind') === null || artifact.kind === query.get('kind'))
      .filter(
        (artifact) =>
          query.get('review_status') === null ||
          artifact.review_status === query.get('review_status'),
      )
      .toSorted(
        (a, b) =>
          kinds.indexOf(a.kind) - kinds.indexOf(b.kind) || a.created_at.localeCompare(b.created_at),
      )
    return HttpResponse.json(paginate(artifacts, request))
  }),

  http.get('/api/v1/artifacts/:artifactId', async ({ params }) => {
    const answered = await answerScenario(mockScenario('artifact'))
    if (answered !== null) return answered
    const artifact = mockArtifacts.find(({ id }) => id === params.artifactId)
    return artifact === undefined
      ? notFound('The artifact')
      : HttpResponse.json(currentArtifact(artifact))
  }),

  http.get('/api/v1/artifacts/:artifactId/items', async ({ params, request }) => {
    const answered = await answerScenario(mockScenario('artifact'))
    if (answered !== null) return answered
    const artifactId = String(params.artifactId)
    if (!mockArtifacts.some(({ id }) => id === artifactId)) return notFound('The artifact')
    const all = allItems()
    const byId = new Map(all.map((item) => [item.id, item]))
    const query = new URL(request.url).searchParams
    const items = all
      .filter((item) => item.artifact_id === artifactId)
      .filter((item) => query.get('kind') === null || item.kind === query.get('kind'))
      .map((item) => ({ ...item, depth: depthOf(item, byId) }))
    return HttpResponse.json(paginate(items, request))
  }),

  http.get('/api/v1/artifacts/:artifactId/revisions', ({ params, request }) => {
    const artifact = mockArtifacts.find(({ id }) => id === params.artifactId)
    if (artifact === undefined) return notFound('The artifact')
    const revisions = Array.from({ length: artifact.version }, (_, index) => ({
      version: artifact.version - index,
      change_reason: artifact.version - index === 1 ? 'generated' : 'rework',
      changed_by: artifact.created_by,
      created_at: artifact.created_at,
      content: artifact.content,
    }))
    return HttpResponse.json(paginate(revisions, request))
  }),

  http.get('/api/v1/projects/:projectId/items', async ({ params, request }) => {
    const scenario = mockScenario('items')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    if (scenario === 'empty') return HttpResponse.json({ items: [], next_cursor: null })
    const query = new URL(request.url).searchParams
    const needle = (query.get('q') ?? '').toLowerCase()
    const items = allItems()
      .filter((item) => item.project_id === projectId)
      .filter((item) => query.get('kind') === null || item.kind === query.get('kind'))
      .filter(
        (item) =>
          needle === '' ||
          item.key.toLowerCase().includes(needle) ||
          JSON.stringify(item.content).toLowerCase().includes(needle),
      )
      .toSorted((a, b) => a.key.localeCompare(b.key))
    return HttpResponse.json(paginate(items, request))
  }),

  http.get('/api/v1/items/:itemId', async ({ params }) => {
    const scenario = mockScenario('item')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    if (scenario === 'empty') return notFound('The item')
    const item = findItem(String(params.itemId))
    return item === undefined ? notFound('The item') : HttpResponse.json(item)
  }),

  http.patch('/api/v1/items/:itemId', async ({ params, request }) => {
    const item = findItem(String(params.itemId))
    if (item === undefined) return notFound('The item')
    const based = ifMatch(request)
    if (based !== item.version) {
      return problem(
        409,
        'version_conflict',
        'Version conflict',
        `The item is at version ${String(item.version)}; the request was based on version ${String(based)}.`,
      )
    }
    if (projectOfRunning(item.project_id)) {
      return problem(
        409,
        'invalid_state',
        'Invalid state',
        'The items are read-only while a run is running.',
      )
    }
    const body = (await request.json()) as {
      content?: Record<string, unknown>
      review_status?: string
    }
    const kind = mockArtifactKinds.artifact_kinds
      .flatMap((artifact) => artifact.item_kinds)
      .find((entry) => entry.kind === item.kind)
    const content = { ...item.content, ...body.content }
    if (kind !== undefined) {
      const problems = validateContent(fieldViews(kind.schema), content)
      const fields = Object.entries(problems)
      if (fields.length > 0) {
        return validationFailed(
          fields.map(([field, message]) => ({ field: `content.${field}`, message })),
        )
      }
    }
    const version = item.version + 1
    const updatedAt = now()
    saveEdit(
      item,
      {
        version,
        content,
        updated_at: updatedAt,
        ...(body.review_status !== undefined && { review_status: body.review_status }),
      },
      {
        version,
        change_reason: 'user_edit',
        changed_by: userOrigin,
        created_at: updatedAt,
        content,
      },
    )
    return HttpResponse.json(findItem(item.id))
  }),

  http.get('/api/v1/items/:itemId/revisions', ({ params, request }) => {
    const item = findItem(String(params.itemId))
    return item === undefined
      ? notFound('The item')
      : HttpResponse.json(paginate(revisionsOf(item), request))
  }),

  http.post('/api/v1/items/:itemId/restore', async ({ params, request }) => {
    const item = findItem(String(params.itemId))
    if (item === undefined) return notFound('The item')
    const body = (await request.json()) as { version?: number }
    const target = revisionsOf(item).find(({ version }) => version === body.version)
    if (target === undefined) {
      return validationFailed([{ field: 'version', message: 'No such version.' }])
    }
    const version = item.version + 1
    const updatedAt = now()
    saveEdit(
      item,
      { version, content: target.content, updated_at: updatedAt },
      {
        version,
        change_reason: 'restored',
        changed_by: userOrigin,
        created_at: updatedAt,
        content: target.content,
      },
    )
    return HttpResponse.json(findItem(item.id))
  }),

  http.get('/api/v1/items/:itemId/trace', async ({ params, request }) => {
    const answered = await answerScenario(mockScenario('trace'))
    if (answered !== null) return answered
    const item = findItem(String(params.itemId))
    if (item === undefined) return notFound('The item')
    const query = new URL(request.url).searchParams
    return HttpResponse.json(
      traceOf(item, query.get('direction') ?? 'both', Number(query.get('depth')) || 5),
    )
  }),

  http.post('/api/v1/projects/:projectId/exports', async ({ params, request }) => {
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    const body = (await request.json()) as { template?: string; format?: string }
    const template = definition.export_templates.find(({ key }) => key === body.template)
    if (!template?.formats.includes(body.format ?? '')) {
      return validationFailed([
        {
          field: template === undefined ? 'template' : 'format',
          message: 'Not offered by the workflow.',
        },
      ])
    }
    const entry: Export = {
      id: createdId(IdPrefix.Export, createdExports.get().length + 1),
      project_id: projectId,
      template: template.key,
      format: body.format ?? 'markdown',
      status: 'pending',
      file_name: `${template.key}.${body.format === 'markdown' ? 'md' : (body.format ?? 'txt')}`,
      size_bytes: null,
      download_url: null,
      created_at: now(),
    }
    createdExports.set([entry, ...createdExports.get()])
    return HttpResponse.json(entry, { status: 202 })
  }),

  http.get('/api/v1/projects/:projectId/exports', ({ params, request }) => {
    const projectId = String(params.projectId)
    const exports = createdExports
      .get()
      .filter((entry) => entry.project_id === projectId)
      .map(served)
    return HttpResponse.json(paginate(exports, request))
  }),

  http.get('/api/v1/exports/:exportId', ({ params }) => {
    const entry = createdExports.get().find(({ id }) => id === params.exportId)
    return entry === undefined ? notFound('The export') : HttpResponse.json(served(entry))
  }),

  http.get('/api/v1/exports/:exportId/file', ({ params }) => {
    const entry = createdExports.get().find(({ id }) => id === params.exportId)
    if (entry === undefined) return notFound('The export')
    return new HttpResponse(fileOf(entry), {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${entry.file_name}"`,
      },
    })
  }),
]
