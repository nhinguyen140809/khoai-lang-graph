import { type Coverage, isLinkOutOfDate } from '@/modules/trace/entities'
import { assertPresent } from '@/shared/lib/guards'

import type { GapRule } from '../trace-links.types'
import {
  builtFromTopKinds,
  chain,
  chainLinkTypes,
  derivedKinds,
  topKinds,
} from '../traceability.constants'
import { distinctById, itemsAndLinksOf, toSummary } from './project-links.lookup'

// The coverage of a project: the items whose links leave something to look at. The kinds come from
// the chain of the definition: the top of the chain is built from the level under it. The words
// of each gap are those the user reads, as the API gives them.

const topKind = assertPresent(topKinds[0], 'The top of the chain holds a kind')

// One rule for each gap: a gap is added by adding a rule.
const gapRules: GapRule[] = [
  {
    key: `no_${topKind}`,
    title: 'Requirements without a user story',
    description:
      'These specified requirements have no user stories in the backlog that is built from them yet.',
    itemsIn: ({ items, sourcesOf }) =>
      items.filter(
        (item) =>
          builtFromTopKinds.includes(item.kind) &&
          !sourcesOf(item, chain.derivation).some(({ kind }) => topKinds.includes(kind)),
      ),
  },
  {
    key: 'no_source',
    title: 'Requirements without a source',
    description: 'These requirements are not based on any need from the interviews.',
    itemsIn: ({ items, targetsOf }) =>
      items.filter(
        (item) =>
          derivedKinds.includes(item.kind) && targetsOf(item, chain.derivation).length === 0,
      ),
  },
  {
    key: 'needs_review',
    title: 'Links to check',
    description:
      'The item that each of these links is based on changed after the link was made, or was replaced.',
    itemsIn: ({ itemById, links }) =>
      distinctById(
        links
          .filter(({ link_type }) => chainLinkTypes.includes(link_type))
          .flatMap((link) => {
            const source = itemById.get(link.source_item_id)
            const target = itemById.get(link.target_item_id)
            return source !== undefined && target !== undefined && isLinkOutOfDate(link, target)
              ? [source]
              : []
          }),
      ),
  },
]

/** The items of a project that need attention, by the reason. */
export function coverageOf(projectId: string): Coverage {
  const project = itemsAndLinksOf(projectId)
  return {
    gaps: gapRules.map(({ key, title, description, itemsIn }) => ({
      key,
      title,
      description,
      items: itemsIn(project).map(toSummary),
    })),
  }
}
