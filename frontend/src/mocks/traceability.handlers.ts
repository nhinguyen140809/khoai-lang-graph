import { http, HttpResponse } from 'msw'

import { itemTitle, schemasByKind } from '@/features/artifacts'

import { mockArtifactKinds } from './artifact-kinds.fixtures'
import { mockTraceLinks } from './artifacts.fixtures'
import { allItems } from './artifacts.handlers'
import { answerScenario, mockScenario } from './mock-scenario.utils'
import { paginate } from './pagination.utils'
import { notFound } from './problem.utils'
import { findProject } from './projects.handlers'

// The traceability views of a project, computed from its items and trace links.

type Item = ReturnType<typeof allItems>[number]

const schemas = schemasByKind(mockArtifactKinds)

function ref(item: Item) {
  return {
    item_id: item.id,
    key: item.key,
    kind: item.kind,
    title: itemTitle(schemas.get(item.kind), item),
  }
}

const matrixColumns = [
  { key: 'backlog', label: 'Backlog', kinds: ['backlog_item'] },
  { key: 'spec', label: 'Spec', kinds: ['spec_requirement'] },
  { key: 'analyzed', label: 'Analyzed', kinds: ['analyzed_requirement'] },
  { key: 'source', label: 'Source', kinds: ['raw_requirement', 'latent_need'] },
  { key: 'evidence', label: 'Evidence', kinds: ['interview_message'] },
]

function projectData(projectId: string) {
  const items = allItems().filter((item) => item.project_id === projectId)
  const byId = new Map(items.map((item) => [item.id, item]))
  const links = mockTraceLinks.filter(
    ({ source_item_id, target_item_id }) => byId.has(source_item_id) && byId.has(target_item_id),
  )
  /** The items that this item points to with a link type, or that point to it. */
  const out = (item: Item, type: string) =>
    links
      .filter((link) => link.source_item_id === item.id && link.link_type === type)
      .flatMap((link) => byId.get(link.target_item_id) ?? [])
  const into = (item: Item, type: string) =>
    links
      .filter((link) => link.target_item_id === item.id && link.link_type === type)
      .flatMap((link) => byId.get(link.source_item_id) ?? [])
  return { items, byId, links, out, into }
}

function matrixOf(projectId: string) {
  const { items, out, into } = projectData(projectId)
  const analyzed = items.filter(({ kind }) => kind === 'analyzed_requirement')
  const specs = items.filter(({ kind }) => kind === 'spec_requirement')
  const rows: Record<string, ReturnType<typeof ref>[]>[] = []

  const sourcesOf = (item: Item) => {
    const sources = out(item, 'derived_from')
    const evidence = sources.flatMap((source) => out(source, 'evidenced_by'))
    return {
      source: sources.map(ref),
      evidence: [...new Map(evidence.map((entry) => [entry.id, ref(entry)])).values()],
    }
  }

  for (const spec of specs) {
    const backlog = into(spec, 'derived_from').filter(({ kind }) => kind === 'backlog_item')
    const parents = out(spec, 'derived_from').filter(({ kind }) => kind === 'analyzed_requirement')
    for (const entry of backlog.length === 0 ? [undefined] : backlog) {
      for (const parent of parents.length === 0 ? [undefined] : parents) {
        rows.push({
          backlog: entry === undefined ? [] : [ref(entry)],
          spec: [ref(spec)],
          analyzed: parent === undefined ? [] : [ref(parent)],
          ...(parent === undefined ? { source: [], evidence: [] } : sourcesOf(parent)),
        })
      }
    }
  }
  const covered = new Set(rows.flatMap((row) => row.analyzed?.map(({ item_id }) => item_id) ?? []))
  for (const item of analyzed.filter(({ id }) => !covered.has(id))) {
    rows.push({ backlog: [], spec: [], analyzed: [ref(item)], ...sourcesOf(item) })
  }
  return { columns: matrixColumns, rows: rows.map((cells) => ({ cells })) }
}

function coverageOf(projectId: string) {
  const { items, byId, links, out, into } = projectData(projectId)
  const specs = items.filter(({ kind }) => kind === 'spec_requirement')
  const noBacklog = specs.filter(
    (spec) => !into(spec, 'derived_from').some(({ kind }) => kind === 'backlog_item'),
  )
  const noSource = items.filter(
    (item) =>
      (item.kind === 'spec_requirement' || item.kind === 'analyzed_requirement') &&
      out(item, 'derived_from').length === 0,
  )
  // A link made against an older version of its target, or to a target that was replaced, marks
  // its source as out of date.
  const stale = new Map<string, Item>()
  for (const link of links) {
    const source = byId.get(link.source_item_id)
    const target = byId.get(link.target_item_id)
    if (source === undefined || target === undefined) continue
    if (link.link_type !== 'derived_from' && link.link_type !== 'evidenced_by') continue
    if (link.target_version < target.version || target.review_status === 'superseded') {
      stale.set(source.id, source)
    }
  }
  return {
    gaps: [
      {
        key: 'no_backlog_item',
        label: 'No backlog item',
        description: 'Specified requirements that no backlog item was derived from.',
        items: noBacklog.map(ref),
      },
      {
        key: 'no_source',
        label: 'No source',
        description: 'Specified or analyzed requirements that were not derived from anything.',
        items: noSource.map(ref),
      },
      {
        key: 'needs_review',
        label: 'Needs review',
        description: 'Items derived from a version of another item that has changed since.',
        items: [...stale.values()].map(ref),
      },
    ],
  }
}

export const traceabilityHandlers = [
  http.get('/api/v1/projects/:projectId/traceability/matrix', async ({ params }) => {
    const answered = await answerScenario(mockScenario('traceability'))
    if (answered !== null) return answered
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    if (mockScenario('traceability') === 'empty') {
      return HttpResponse.json({ columns: matrixColumns, rows: [] })
    }
    return HttpResponse.json(matrixOf(projectId))
  }),

  http.get('/api/v1/projects/:projectId/traceability/coverage', async ({ params }) => {
    const answered = await answerScenario(mockScenario('coverage'))
    if (answered !== null) return answered
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    return HttpResponse.json(coverageOf(projectId))
  }),

  http.get('/api/v1/projects/:projectId/trace-links', ({ params, request }) => {
    const projectId = String(params.projectId)
    if (findProject(projectId) === undefined) return notFound('The project')
    const query = new URL(request.url).searchParams
    const { links } = projectData(projectId)
    const types = query.getAll('link_type')
    const found = links
      .filter((link) => types.length === 0 || types.includes(link.link_type))
      .filter(
        (link) =>
          query.get('source_item_id') === null ||
          link.source_item_id === query.get('source_item_id'),
      )
      .filter(
        (link) =>
          query.get('target_item_id') === null ||
          link.target_item_id === query.get('target_item_id'),
      )
    return HttpResponse.json(paginate(found, request))
  }),
]
