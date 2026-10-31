import { describe, expect, it } from 'vitest'

import { defaultRunConfigFixture } from '../../runs/fixtures/runs.fixtures'
import { allModels, modelIdsForRole } from '../models.lookup'
import { roleCases } from './models.lookup.data'

describe('allModels', () => {
  it('lists the catalog by model id', () => {
    const ids = allModels().map(({ model_id: modelId }) => modelId)

    expect(ids).toHaveLength(6)
    expect(ids).toEqual(ids.toSorted())
  })
})

describe('modelIdsForRole', () => {
  it.each(roleCases)('lists $name', ({ role, ids, absent }) => {
    const found = modelIdsForRole(role)

    expect(found).toEqual(expect.arrayContaining(ids))
    expect(found).toHaveLength(ids.length)
    for (const id of absent) expect(found).not.toContain(id)
  })

  it('holds the model that the server default gives each role', () => {
    for (const [role, modelId] of Object.entries(defaultRunConfigFixture.models)) {
      expect(modelIdsForRole(role), role).toContain(modelId)
    }
  })
})
