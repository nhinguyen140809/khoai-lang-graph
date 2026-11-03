import type { Matrix } from '@/modules/trace/entities'
import { findLinkType, type LinkType, type WorkflowDefinition } from '@/modules/workflow/entities'
import { snakeToSentenceCase } from '@/shared/lib/formatters'
import { assertPresent } from '@/shared/lib/guards'

/** The link type of a definition with this key; a definition without it is a mistake of the fixtures. */
export function getLinkType(definition: WorkflowDefinition, key: string): LinkType {
  return assertPresent(findLinkType(definition, key), `No link type ${key}`)
}

/** The readable name of some kinds of item, such as "Raw requirement / Latent need". */
export function kindsTitle(kinds: readonly string[]): string {
  return kinds.map(snakeToSentenceCase).join(' / ')
}

/** A column of the matrix that holds the items of some kinds, named after its first kind. */
export function matrixColumnOf(kinds: string[]): Matrix['columns'][number] {
  return {
    key: assertPresent(kinds[0], 'A column holds a kind'),
    title: kindsTitle(kinds),
    kinds,
  }
}
