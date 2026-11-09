import type { WorkflowDefinition } from './workflow-definition.types'
import type { LinkType, LinkTypeChoice } from './workflow-vocabulary.types'

/** One end of a pair of a link type: the kinds it lists, any kind, or (for the target) the kind of the source. */
type PairEnd = LinkType['pairs'][number]['source']

/** The link type of the definition with this key, or null when it has none. */
export function findLinkType(definition: WorkflowDefinition, key: string): LinkType | null {
  return definition.link_types.find((linkType) => linkType.key === key) ?? null
}

/** The pairs that list their kinds: `any` and `same` name no kind. */
function listedPairs(linkType: LinkType): { source: string[]; target: string[] }[] {
  return linkType.pairs.flatMap(({ source, target }) =>
    Array.isArray(source) && Array.isArray(target) ? [{ source, target }] : [],
  )
}

/** The kinds that the pairs of a link type lead to, without a repeat, in the order they are listed. */
export function targetKindsOf(linkType: LinkType): string[] {
  return [...new Set(listedPairs(linkType).flatMap(({ target }) => target))]
}

/**
 * The kinds of link that an item of one kind may start by hand: every link type with a pair whose
 * source lists the kind, except those that only the agents create, each with its title and the
 * kinds that its pairs lead to. A target of `same` names the kind of the source; a target of `any`
 * names no kind, so the choice searches every kind.
 */
export function linkTypesFrom(
  definition: WorkflowDefinition,
  sourceKind: string,
): LinkTypeChoice[] {
  return definition.link_types
    .filter(({ agent_only: isAgentOnly }) => !isAgentOnly)
    .filter((linkType) =>
      linkType.pairs.some(({ source }) => isSourceKindListed(source, sourceKind)),
    )
    .map((linkType) => ({
      key: linkType.key,
      title: linkType.title,
      targetKinds: [
        ...new Set(
          linkType.pairs.flatMap(({ source, target }) => {
            if (!isSourceKindListed(source, sourceKind)) return []
            if (target === 'same') return [sourceKind]
            return target === 'any' ? [] : target
          }),
        ),
      ],
    }))
}

function isSourceKindListed(end: PairEnd, sourceKind: string): boolean {
  return end === 'any' || (end !== 'same' && end.includes(sourceKind))
}

function isTargetKindListed(end: PairEnd, targetKind: string, sourceKind: string): boolean {
  if (end === 'any') return true
  return end === 'same' ? targetKind === sourceKind : end.includes(targetKind)
}

/** Whether some pair of the link type lists the kind of the source and the kind of the target. */
export function canLinkTypeConnect(
  linkType: LinkType,
  sourceKind: string,
  targetKind: string,
): boolean {
  return linkType.pairs.some(
    ({ source, target }) =>
      isSourceKindListed(source, sourceKind) && isTargetKindListed(target, targetKind, sourceKind),
  )
}

/**
 * The item kinds that a link type connects, in levels: first the kinds that start links of the type
 * and receive none, then the kinds those links lead to, and so on. A kind is in the first level
 * where it appears, so a loop ends the levels. Only the pairs that list their kinds count: `any`
 * and `same` name no kind.
 */
export function kindLevelsOf(linkType: LinkType): string[][] {
  const pairs = listedPairs(linkType)
  const receivers = new Set(pairs.flatMap(({ target }) => target))
  let level = [...new Set(pairs.flatMap(({ source }) => source))].filter(
    (kind) => !receivers.has(kind),
  )
  const placed = new Set(level)
  const levels: string[][] = []
  while (level.length > 0) {
    levels.push(level)
    const current = level
    level = [
      ...new Set(
        pairs
          .filter(({ source }) => source.some((kind) => current.includes(kind)))
          .flatMap(({ target }) => target),
      ),
    ].filter((kind) => !placed.has(kind))
    for (const kind of level) placed.add(kind)
  }
  return levels
}
