import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'

import { itemTabTitle } from '../item-tab.utils'

const record = itemFixtureByKey(projectIds.mentor, 'RAW-001')
const schema = contentSchemaFixtureByKind(record.kind)

describe('itemTabTitle', () => {
  it('is the title of the item once the item and its schema are known', () => {
    expect(itemTabTitle(record, schema)).toBe('Find a mentor in my field')
  })

  it('is unknown while the schema loads, so the item does not read as its key', () => {
    expect(itemTabTitle(record, undefined)).toBeNull()
  })

  it('is unknown while the item loads', () => {
    expect(itemTabTitle(undefined, undefined)).toBeNull()
    expect(itemTabTitle(undefined, schema)).toBeNull()
  })
})
