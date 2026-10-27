import { describe, expect, it } from 'vitest'

import { findKind } from '../../../workflow/artifact-kinds.fixtures'
import { artifactFixtures, itemFixtures } from '../artifacts.fixtures'

describe('the artifact fixtures', () => {
  it('follow the schema version that the definition gives their kind', () => {
    const behind = [...artifactFixtures, ...itemFixtures]
      .filter(({ kind, schema_version }) => findKind(kind)?.schema_version !== schema_version)
      .map(({ kind }) => kind)

    expect(behind).toEqual([])
  })
})
