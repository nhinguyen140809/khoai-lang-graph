import type { ArtifactItem } from '@/modules/artifact/entities'
import {
  canLinkTypeConnect,
  contentDisplayOf,
  contentFields,
  findQuote,
} from '@/modules/workflow/entities'
import type { FieldProblem } from '@/shared/api/error'
import { distancesFrom, successorsFrom } from '@/shared/lib/graph'

import { findKind } from '../../workflow/artifact-kinds.fixtures'
import { allTraceLinks } from '../lookup/trace-links.lookup'
import type { CandidateLink, LinkRule } from '../trace-links.types'

// The rules that a link between two items of a project must keep, each one a strategy that
// `validateNewTraceLink` tries in turn. A rule is added by adding a strategy to `linkRules`.

// The current links of the type of a candidate.
function linksOfSameType({ linkType }: CandidateLink) {
  return allTraceLinks().filter(({ link_type }) => link_type === linkType.key)
}

/** The problem of a field that does not name an item the link may use. */
export function chooseItemProblem(field: string): FieldProblem {
  return { field, message: 'Choose an item of the project.' }
}

// A section is a heading that groups items: the definition shows its kind as a heading.
function isSection({ kind }: ArtifactItem): boolean {
  const schema = findKind(kind)?.schema
  return schema !== undefined && contentDisplayOf(schema) === 'heading'
}

// Both ends are items of the project, and a section is never linked.
const endsAreLinkable: LinkRule = {
  check: ({ projectId, source, target }) => {
    const isLinkable = (item: ArtifactItem) => item.project_id === projectId && !isSection(item)
    if (!isLinkable(source)) return chooseItemProblem('source_item_id')
    return isLinkable(target) ? null : chooseItemProblem('target_item_id')
  },
}

const notToItself: LinkRule = {
  check: ({ source, target }) =>
    source.id === target.id
      ? { field: 'target_item_id', message: 'A link cannot go to its own item.' }
      : null,
}

const kindsAreConnected: LinkRule = {
  check: ({ source, target, linkType }) =>
    canLinkTypeConnect(linkType, source.kind, target.kind)
      ? null
      : {
          field: 'link_type',
          message: `A ${linkType.title.toLowerCase()} link does not connect these kinds of item.`,
        },
}

const notARepeat: LinkRule = {
  check: (candidate) => {
    const isRepeat = linksOfSameType(candidate).some(
      (link) =>
        link.source_item_id === candidate.source.id && link.target_item_id === candidate.target.id,
    )
    return isRepeat ? { field: 'target_item_id', message: 'The link exists already.' } : null
  },
}

// A link from the source to the target makes a loop when the target already leads back to the
// source through links of the type; only a type that must stay free of loops is held to this.
const makesNoLoop: LinkRule = {
  check: (candidate) => {
    if (!candidate.linkType.acyclic) return null
    const successorsOf = successorsFrom(
      linksOfSameType(candidate),
      (link) => link.source_item_id,
      (link) => link.target_item_id,
    )
    const reachedFromTarget = distancesFrom([candidate.target.id], successorsOf, null)
    return reachedFromTarget.has(candidate.source.id)
      ? { field: 'target_item_id', message: 'The link would make a loop.' }
      : null
  },
}

// Where the words of a quote sit in a text field of the item, or null when no field holds them.
function quoteIn(item: ArtifactItem, quote: string) {
  const schema = findKind(item.kind)?.schema
  const fields = schema === undefined ? [] : contentFields(schema)
  return findQuote(fields, item.content, quote)
}

// The words of a link: at most 300 characters, on a side its type may quote, and found word for
// word in a text field of their item.
const quotesAreAllowed: LinkRule = {
  check: ({ source, target, linkType, targetQuote, sourceQuote }) => {
    if (targetQuote !== null && targetQuote.length > 300) {
      return { field: 'target_quote', message: 'A quote holds at most 300 characters.' }
    }
    if (sourceQuote !== null && sourceQuote.length > 300) {
      return { field: 'source_quote', message: 'A quote holds at most 300 characters.' }
    }
    if (targetQuote !== null && !linkType.quotes.target) {
      return {
        field: 'target_quote',
        message: 'A link of this type quotes no words of its target.',
      }
    }
    if (sourceQuote !== null && !linkType.quotes.source) {
      return {
        field: 'source_quote',
        message: 'A link of this type quotes no words of its source.',
      }
    }
    if (targetQuote !== null && quoteIn(target, targetQuote) === null) {
      return {
        field: 'target_quote',
        message: 'The words are not found in the text of the target.',
      }
    }
    if (sourceQuote !== null && quoteIn(source, sourceQuote) === null) {
      return {
        field: 'source_quote',
        message: 'The words are not found in the text of the source.',
      }
    }
    return null
  },
}

/** The rules in the order they are tried: the cheap ones first. */
export const linkRules: LinkRule[] = [
  endsAreLinkable,
  notToItself,
  kindsAreConnected,
  notARepeat,
  makesNoLoop,
  quotesAreAllowed,
]
