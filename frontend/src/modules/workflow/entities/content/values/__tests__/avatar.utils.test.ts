import { describe, expect, it } from 'vitest'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'

import { avatarOf } from '../avatar.utils'

const spec = {
  style: 'plain',
  palette: 'fair-brown-gray',
  parts: { hair: 'long-layered', glasses: null },
  colors: { mouth: 'rose' },
}

describe('avatarOf', () => {
  it('reads the face of the field that the schema of the persona names', () => {
    const schema = contentSchemaFixtureByKind('persona')

    expect(avatarOf(schema, { face: spec })).toEqual(spec)
  })

  it('gives null for a kind that names no avatar', () => {
    const schema = { title: 'Kind', properties: { face: { type: 'object' as const } } }

    expect(avatarOf(schema, { face: spec })).toBeNull()
  })

  it('gives null when the field holds no spec, which draws the initials instead', () => {
    const schema = contentSchemaFixtureByKind('persona')

    expect(avatarOf(schema, { face: null })).toBeNull()
    expect(avatarOf(schema, {})).toBeNull()
    expect(avatarOf(schema, { face: { parts: 3 } })).toBeNull()
  })
})
