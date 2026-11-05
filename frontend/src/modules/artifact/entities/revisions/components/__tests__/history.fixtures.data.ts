import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'

import type { RevisionTarget } from '../../../revisions/revisions.types'

/** An analyzed requirement with two versions, whose history the tests read. */
export const historyItem = itemFixtureByKey(projectIds.mentor, 'AR-007')
export const historyTarget: RevisionTarget = { type: 'item', id: historyItem.id }
export const historyCurrentVersion = historyItem.version
