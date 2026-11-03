import { itemFixtureByKey } from '../../../artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '../../../shared/db'

/** The id of an item of the mentor project, by key. */
export function idOf(key: string): string {
  return itemFixtureByKey(projectIds.mentor, key).id
}

/** A trace from some items, and the keys of the items and the count of the links it reaches. */
export const traceCases = [
  {
    name: 'an item with no link is its own trace',
    starts: ['SEC-001'],
    direction: 'both',
    depth: null,
    keys: ['SEC-001'],
    linkCount: 0,
  },
  {
    name: 'backward from a backlog item reaches the interview',
    starts: ['US-001'],
    direction: 'backward',
    depth: null,
    keys: ['AR-001', 'PER-001', 'PER-001#2', 'RAW-001', 'REQ-001', 'US-001'],
    linkCount: 5,
  },
  {
    name: 'forward from a raw requirement reaches the backlog',
    starts: ['RAW-001'],
    direction: 'forward',
    depth: null,
    keys: ['AR-001', 'RAW-001', 'REQ-001', 'US-001'],
    linkCount: 3,
  },
  {
    name: 'both directions join the two chains of an item',
    starts: ['AR-001'],
    direction: 'both',
    depth: null,
    keys: ['AR-001', 'PER-001', 'PER-001#2', 'RAW-001', 'REQ-001', 'US-001'],
    linkCount: 5,
  },
  {
    name: 'a depth of one link stops after the first step',
    starts: ['US-001'],
    direction: 'backward',
    depth: 1,
    keys: ['REQ-001', 'US-001'],
    linkCount: 1,
  },
  {
    name: 'several starts share the items they reach',
    starts: ['US-001', 'REQ-001'],
    direction: 'backward',
    depth: 1,
    keys: ['AR-001', 'REQ-001', 'US-001'],
    linkCount: 2,
  },
]
