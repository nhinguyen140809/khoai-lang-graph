import { type ArtifactItem, reviewStatus } from '@/modules/artifact/entities/@x/trace'

import { linkTypeWords } from './trace-links.constants'
import type { LinkSentenceParts, LinkSentenceTense, TraceLink } from './trace-links.types'

/**
 * Whether a link is out of date: it was made against an older version of its target, or its target
 * was replaced. The source then needs a new look.
 */
export function isLinkOutOfDate(
  link: Pick<TraceLink, 'target_version'>,
  target: Pick<ArtifactItem, 'version' | 'review_status'>,
): boolean {
  return link.target_version < target.version || target.review_status === reviewStatus.superseded
}

/** The key of a link of one item, as the pending action store of its dialog holds it. */
export function linkKeyOf(sourceItemId: string, linkId: string): string {
  return `${sourceItemId}@${linkId}`
}

/** The item and the link that a key of `linkKeyOf` names. */
export function parseLinkKey(key: string): { sourceItemId: string; linkId: string } {
  const [sourceItemId, linkId] = key.split('@')
  if (sourceItemId === undefined || linkId === undefined) {
    throw new Error(`A key of a link names its item and the link: ${key}`)
  }
  return { sourceItemId, linkId }
}

/** The words a link of a type the map does not hold reads between its two items. */
export function hasALinkTo(linkTitle: string): { now: string; will: string } {
  return { now: `has a "${linkTitle}" link to`, will: `have a "${linkTitle}" link to` }
}

/**
 * The pieces of one sentence of a link, so a screen can draw the names of both items as links
 * while the words between them stay text: the title of the source, the words between the two
 * titles, and the title of the target. `linkSentence` joins them; the list of the links reads
 * the parts to link each title to the page of its item.
 */
export function linkSentenceParts(
  source: string,
  linkType: { key: string; title: string },
  target: string,
  { tense }: { tense: LinkSentenceTense },
): LinkSentenceParts {
  const words = linkTypeWords[linkType.key] ?? hasALinkTo(linkType.title)
  const verb =
    tense === 'now'
      ? words.now
      : tense === 'will'
        ? `will ${words.will}`
        : `will no longer ${words.will}`
  return {
    before: '',
    source,
    between: ` ${verb} `,
    target,
    // A title that ends a sentence of its own keeps its own full stop.
    after: /[.!?]$/.test(target) ? '' : '.',
  }
}

/**
 * One sentence of a link, with the titles of both items: "Layered booking flow is based on
 * Students book a session at once." The tense says when: now, at the making of the link
 * (`will`), or after its removal (`noLonger`). The words between the two titles come from the
 * map of the link types; a type the map does not hold says that the item has a link of that type.
 */
export function linkSentence(
  source: string,
  linkType: { key: string; title: string },
  target: string,
  { tense }: { tense: LinkSentenceTense },
): string {
  const parts = linkSentenceParts(source, linkType, target, { tense })
  return `${parts.before}${parts.source}${parts.between}${parts.target}${parts.after}`
}
