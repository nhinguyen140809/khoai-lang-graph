import { findLinkType } from '@/modules/workflow/entities'
import type { FieldProblem } from '@/shared/api/error'

import { findItem } from '../../artifacts/artifacts.lookup'
import {
  choiceProblem,
  optionalText,
  optionalTextProblem,
  requiredText,
} from '../../shared/http/validation'
import { workflowDefinitionFixture } from '../../workflow/workflow.fixtures'
import type { CandidateLink, NewTraceLinkRecord } from '../trace-links.types'
import { chooseItemProblem, linkRules } from './link-rules.validators'

// What the body of a request to make a trace link may hold. `validateNewTraceLink` reads a whole
// body and gives the record that it describes, or the problems of its fields.

interface ReadLink {
  candidate: CandidateLink
  note: string | null
}

// The item that a field of the body names, or undefined when it names none.
function itemNamedBy(value: unknown) {
  const id = requiredText(value)
  return id === undefined ? undefined : findItem(id)
}

// The first step: the body names two items, a link type of the definition and a text for the note.
// Every field that does not is a problem; whether the link is allowed is for the rules.
function parseLink(
  projectId: string,
  body: Record<string, unknown>,
): { read: ReadLink } | { problems: FieldProblem[] } {
  const source = itemNamedBy(body.source_item_id)
  const target = itemNamedBy(body.target_item_id)
  const linkTypeKey = requiredText(body.link_type)
  const linkType =
    linkTypeKey === undefined ? null : findLinkType(workflowDefinitionFixture, linkTypeKey)
  const note = optionalText(body.note)
  const targetQuote = optionalText(body.target_quote)
  const sourceQuote = optionalText(body.source_quote)

  const problems = [
    source === undefined ? chooseItemProblem('source_item_id') : null,
    target === undefined ? chooseItemProblem('target_item_id') : null,
    linkType === null ? choiceProblem('link_type') : null,
    note === undefined ? optionalTextProblem('note') : null,
    targetQuote === undefined ? optionalTextProblem('target_quote') : null,
    sourceQuote === undefined ? optionalTextProblem('source_quote') : null,
  ].filter((problem) => problem !== null)
  // Every problem is listed above; the checks here only let the compiler see that no field is missing.
  if (
    source === undefined ||
    target === undefined ||
    linkType === null ||
    note === undefined ||
    targetQuote === undefined ||
    sourceQuote === undefined
  ) {
    return { problems }
  }
  return {
    read: {
      candidate: {
        projectId,
        source,
        target,
        linkType,
        targetQuote: targetQuote ?? null,
        sourceQuote: sourceQuote ?? null,
      },
      note,
    },
  }
}

// The first rule that the link breaks, or null when it breaks none.
function ruleProblem(candidate: CandidateLink): FieldProblem | null {
  for (const rule of linkRules) {
    const problem = rule.check(candidate)
    if (problem !== null) return problem
  }
  return null
}

/**
 * The link that the body of POST /projects/{project_id}/trace-links describes, or the problems of
 * its fields: the body names its items, a type of the definition and a note that is text, and the
 * link keeps every rule of `linkRules`.
 */
export function validateNewTraceLink(
  projectId: string,
  body: Record<string, unknown>,
): { link: NewTraceLinkRecord } | { problems: FieldProblem[] } {
  const result = parseLink(projectId, body)
  if ('problems' in result) return result

  const { read } = result
  const problem = ruleProblem(read.candidate)
  if (problem !== null) return { problems: [problem] }
  const { source, target, linkType, targetQuote, sourceQuote } = read.candidate
  return {
    link: {
      sourceItemId: source.id,
      targetItemId: target.id,
      linkType: linkType.key,
      targetVersion: target.version,
      targetQuote,
      sourceQuote,
      note: read.note,
    },
  }
}
