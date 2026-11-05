import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import type { Revision } from '../revisions.types'
import {
  parseRevisionKey,
  previousRevision,
  recordKeyOf,
  revisionAuthor,
  revisionKeyOf,
} from '../revisions.utils'
import { revisionTarget } from './revisions.utils.data'

const user = { actor: 'user' as const, agent_role: null, user_id: 'u1', run_id: null, step_id: null }
const analyst = {
  actor: 'agent' as const,
  agent_role: 'analyst',
  user_id: null,
  run_id: 'r1',
  step_id: 's1',
}

function revisionOf(version: number): Revision {
  return {
    version,
    change_reason: 'rework',
    changed_by: analyst,
    created_at: '2026-10-06T08:30:01Z',
    content: {},
  }
}

describe('revisionAuthor', () => {
  it('names the user "You"', () => {
    expect(revisionAuthor(user, undefined)).toBe('You')
  })

  it('names the agent by the label of its role', () => {
    expect(revisionAuthor(analyst, workflowDefinitionFixture)).toBe('Analyst')
  })

  it('names the agent by the key of its role when the definition does not hold it', () => {
    expect(revisionAuthor(analyst, undefined)).toBe('analyst')
  })
})

describe('previousRevision', () => {
  it('gives the version right before, among the loaded ones', () => {
    const revisions = [revisionOf(3), revisionOf(2), revisionOf(1)]

    expect(previousRevision(revisions, 3)?.version).toBe(2)
    expect(previousRevision(revisions, 2)?.version).toBe(1)
  })

  it('gives undefined when the version before is not loaded', () => {
    expect(previousRevision([revisionOf(3)], 3)).toBeUndefined()
  })
})

describe('record keys', () => {
  it('keys a record by its type and id', () => {
    expect(recordKeyOf(revisionTarget)).toBe('item:item-1')
  })

  it('keys one version of a record, and reads the key back', () => {
    const key = revisionKeyOf(revisionTarget, 2)

    expect(key).toBe('item:item-1@2')
    expect(parseRevisionKey(key)).toEqual({ target: revisionTarget, version: 2 })
  })

  it('reads null out of a string that is no key of a version', () => {
    expect(parseRevisionKey('item:item-1')).toBeNull()
    expect(parseRevisionKey('document:item-1@2')).toBeNull()
  })
})
