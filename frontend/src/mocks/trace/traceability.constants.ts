import { derivedFrom, evidencedBy } from '@/modules/trace/entities'
import { kindLevelsOf, targetKindsOf } from '@/modules/workflow/entities'
import { assertPresent } from '@/shared/lib/guards'

import { workflowDefinitionFixture } from '../workflow/workflow.fixtures'
import { getLinkType, matrixColumnOf } from './traceability.utils'

// What the traceability views follow in the workflow definition: the chain of `derived_from` links
// from the backlog down to the raw requirements, and the interview messages that `evidenced_by`
// links lead to. The columns of the matrix and the kinds of the coverage come from them, so a
// definition with other kinds needs no change here. The chain has at least three levels: a top, a
// level built from it, and a last level.

/**
 * The link types that the traceability views follow: `derivation` builds the levels of the chain,
 * `evidence` ties its last level to the interview. The matrix and the coverage read them from here.
 */
export const chain = { derivation: derivedFrom, evidence: evidencedBy }
/** The keys of the link types of the chain. */
export const chainLinkTypes = Object.values(chain)

/** The kinds of the chain of `derived_from`, level by level, from the backlog down. */
export const derivationLevels = kindLevelsOf(
  getLinkType(workflowDefinitionFixture, chain.derivation),
)
/** The kinds at the top of the chain. */
export const topKinds = assertPresent(derivationLevels[0], 'The chain has a top')
/** The kinds one level under the top, which the top is built from. */
export const builtFromTopKinds = assertPresent(derivationLevels[1], 'The chain has a second level')
/** The kinds between the top and the last level: each is derived from the level under it. */
export const derivedKinds = derivationLevels.slice(1, -1).flat()

const evidenceColumn = matrixColumnOf(
  targetKindsOf(getLinkType(workflowDefinitionFixture, chain.evidence)),
)
/** The key of the column that holds the interview messages. */
export const evidenceKey = evidenceColumn.key

/** The columns of the matrix: a column for each level of the chain, then the interview. */
export const matrixColumns = [...derivationLevels.map(matrixColumnOf), evidenceColumn]
