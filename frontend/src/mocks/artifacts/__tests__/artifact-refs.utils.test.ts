import { describe, expect, it } from 'vitest'

import { projectIds } from '../../shared/db'
import { artifactRefOf } from '../artifact-refs.utils'
import { artifactFixtureByKind } from '../fixtures/artifacts.fixtures'

describe('artifactRefOf', () => {
  it('gives the reference of an artifact as it is now', () => {
    const artifact = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')

    expect(artifactRefOf(artifact)).toEqual({
      artifact_id: artifact.id,
      kind: 'requirements_analysis',
      title: artifact.title,
      version: artifact.version,
    })
  })
})
