import { itemFixtureByKey } from '../../../artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '../../../shared/db'

export const projectId = projectIds.mentor

/** The id of an item of the mentor project, by key. */
function idOf(key: string, project = projectId): string {
  return itemFixtureByKey(project, key).id
}

function body(source: string, target: string, linkType: string) {
  return { source_item_id: idOf(source), target_item_id: idOf(target), link_type: linkType }
}

/** A body of a new link, and the fields that the validator refuses it for. */
export const refusedLinkCases = [
  {
    name: 'a body with no field',
    body: {},
    fields: ['source_item_id', 'target_item_id', 'link_type'],
  },
  {
    name: 'an item of another project',
    body: {
      ...body('REQ-001', 'AR-001', 'depends_on'),
      source_item_id: idOf('REQ-001', projectIds.campus),
    },
    fields: ['source_item_id'],
  },
  {
    name: 'a section',
    body: body('SEC-001', 'REQ-001', 'depends_on'),
    fields: ['source_item_id'],
  },
  {
    name: 'a link type the definition does not have',
    body: body('REQ-001', 'AR-001', 'made_up'),
    fields: ['link_type'],
  },
  {
    name: 'a link to its own item',
    body: body('REQ-001', 'REQ-001', 'depends_on'),
    fields: ['target_item_id'],
  },
  {
    name: 'a link type that only the agents create',
    body: body('REQ-001', 'REQ-002', 'supersedes'),
    fields: ['link_type'],
  },
  {
    name: 'a pair of kinds the type does not connect',
    body: body('REQ-001', 'PER-001', 'derived_from'),
    fields: ['link_type'],
  },
  {
    name: 'a link that exists already',
    body: body('REQ-001', 'AR-001', 'derived_from'),
    fields: ['target_item_id'],
  },
  {
    name: 'a link that would make a loop in a type that must not loop',
    body: body('REQ-006', 'REQ-003', 'depends_on'),
    fields: ['target_item_id'],
  },
  {
    name: 'a note that is not text',
    body: { ...body('REQ-002', 'REQ-001', 'depends_on'), note: 3 },
    fields: ['note'],
  },
]

/** A body of a new link that the validator takes, and the link it gives. */
export const acceptedLinkCases = [
  {
    name: 'a link between two requirements that depend on each other in one direction',
    body: { ...body('REQ-002', 'REQ-001', 'depends_on'), note: 'Search comes first.' },
    link: {
      sourceItemId: idOf('REQ-002'),
      targetItemId: idOf('REQ-001'),
      linkType: 'depends_on',
      note: 'Search comes first.',
    },
  },
  {
    name: 'a link with no note',
    body: body('US-002', 'US-001', 'depends_on'),
    link: {
      sourceItemId: idOf('US-002'),
      targetItemId: idOf('US-001'),
      linkType: 'depends_on',
      note: null,
    },
  },
]
