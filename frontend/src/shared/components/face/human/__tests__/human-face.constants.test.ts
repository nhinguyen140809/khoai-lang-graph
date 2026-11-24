import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readFacesCatalog } from '@/test/docs'

import { moods } from '../../face.types'
import { humanEyeArt } from '../human-eye-art.constants'
import {
  faceArt,
  faceCatalog,
  humanLookOffsets,
  humanLooks,
  monochromePalette,
} from '../human-face.constants'
import { variantOf } from '../human-face.utils'

const isUnique = (list: readonly string[]) => new Set(list).size === list.length

describe('the catalog of the faces of people', () => {
  it('is the catalog of the docs, as the web app keeps a copy of it', () => {
    expect(faceCatalog).toEqual(readFacesCatalog())
  })

  it('has the ids of the art for each part, and no more', () => {
    for (const part of faceCatalog.parts) {
      const drawings = Object.keys(
        (faceArt.components as Record<string, { variants: object }>)[part.key]?.variants ?? {},
      )

      expect(part.variants.map(({ art }) => art).sort(), part.key).toEqual(drawings.sort())
    }
    expect(faceCatalog.parts.map(({ key }) => key).sort()).toEqual(
      Object.keys(faceArt.components).sort(),
    )
  })

  it('has the color roles of the art, the background and the eyelids, and no more', () => {
    expect(faceCatalog.colors.map(({ role }) => role).sort()).toEqual(
      [...Object.keys(faceArt.colors), 'background', 'eyelids'].sort(),
    )
  })

  it('has the art of the eyes for each variant of the eyes, with a shape to draw', () => {
    const eyes = faceCatalog.parts.find(({ key }) => key === 'eyes')

    expect(Object.keys(humanEyeArt).sort()).toEqual(eyes?.variants.map(({ art }) => art).sort())
    for (const [art, shapes] of Object.entries(humanEyeArt)) {
      expect(shapes.iris + shapes.lid, art).not.toBe('')
      expect(shapes.iris === '', art).toBe(
        shapes.spots.left === null && shapes.spots.right === null,
      )
    }
  })

  it('has unique keys in each list', () => {
    expect(isUnique(faceCatalog.styles.map(({ key }) => key))).toBe(true)
    expect(isUnique(faceCatalog.tagCategories.map(({ key }) => key))).toBe(true)
    expect(isUnique(faceCatalog.parts.map(({ key }) => key))).toBe(true)
    expect(isUnique(faceCatalog.palettes.map(({ key }) => key))).toBe(true)
    for (const category of faceCatalog.tagCategories) expect(isUnique(category.values)).toBe(true)
    for (const part of faceCatalog.parts) {
      expect(isUnique(part.variants.map(({ key }) => key)), part.key).toBe(true)
    }
    for (const { role, tokens } of faceCatalog.colors) {
      expect(isUnique(tokens.map(({ key }) => key)), role).toBe(true)
    }
  })

  it('names only what it has: the style of a part, the values of a tag, the token of a palette', () => {
    const styles = faceCatalog.styles.map(({ key }) => key)
    const values = (category: string) =>
      faceCatalog.tagCategories.find(({ key }) => key === category)?.values
    const tags = faceCatalog.parts.flatMap((part) =>
      part.variants.flatMap((variant) => Object.entries(variant.tags)),
    )

    for (const { style } of faceCatalog.parts) expect(styles).toContain(style)
    for (const [category, list] of tags) {
      for (const value of list) expect(values(category)).toContain(value)
    }
    for (const palette of faceCatalog.palettes) {
      const named = faceCatalog.colors.filter(({ fromSeed }) => fromSeed !== true)
      for (const { role, tokens } of named) {
        expect(
          tokens.map(({ key }) => key),
          `${palette.key} ${role}`,
        ).toContain(palette.tokens[role])
      }
    }
  })

  it('tags every variant with at least one value of every kind of tag', () => {
    for (const part of faceCatalog.parts) {
      for (const variant of part.variants) {
        for (const { key } of faceCatalog.tagCategories) {
          expect(
            variant.tags[key]?.length ?? 0,
            `${part.key} ${variant.key} ${key}`,
          ).toBeGreaterThan(0)
        }
      }
    }
  })

  it('has palettes whose tags no token of them fits less than', () => {
    const tagsOf = (role: string, token: string) =>
      faceCatalog.colors
        .find((color) => color.role === role)
        ?.tokens.find(({ key }) => key === token)?.tags
    const misfits = faceCatalog.palettes.flatMap((palette) =>
      Object.entries(palette.tokens).flatMap(([role, token]) =>
        Object.entries(palette.tags).flatMap(([category, wanted]) =>
          wanted
            .filter((value) => !(tagsOf(role, token)?.[category] ?? wanted).includes(value))
            .map((value) => `${palette.key} ${role} ${token} ${value}`),
        ),
      ),
    )

    expect(misfits).toEqual([])
  })

  it('has a value of its own for each token of a role', () => {
    const sheet = readFileSync(
      resolve(process.cwd(), 'src/shared/components/face/human/human-face.css'),
      'utf8',
    )
    const values = [...sheet.matchAll(/^\s*--human-face-(\w+?)-([\w-]+):\s*(#[0-9a-f]{6});/gm)].map(
      ([, role = '', , value = '']) => `${role} ${value}`,
    )

    expect(isUnique(values)).toBe(true)
  })

  it('has the palette of black on white', () => {
    expect(faceCatalog.palettes.map(({ key }) => key)).toContain(monochromePalette)
  })

  it('has a custom property for each token in the style sheet of the face, and none besides', () => {
    const sheet = readFileSync(
      resolve(process.cwd(), 'src/shared/components/face/human/human-face.css'),
      'utf8',
    )
    const properties = [...sheet.matchAll(/^\s*(--human-face-[\w-]+):/gm)].map(
      ([, name = '']) => name,
    )
    const tokens = faceCatalog.colors.flatMap(({ role, tokens: list }) =>
      list.map(({ key }) => `--human-face-${role}-${key}`),
    )

    expect([...new Set(properties)].sort()).toEqual(tokens.sort())
  })
})

describe('the families of eyes', () => {
  const eyes = faceCatalog.parts.find(({ key }) => key === 'eyes')?.variants.map(({ key }) => key)

  it('name only eyes and kinds that the catalog has, with an eye once in a family', () => {
    for (const { key, members } of faceCatalog.eyeFamilies) {
      expect(isUnique(members.map(({ variant, kind }) => `${variant} ${kind}`)), key).toBe(true)
      for (const { variant, kind } of members) {
        expect(eyes, `${key} ${variant}`).toContain(variant)
        expect(faceCatalog.eyeKinds, `${key} ${variant}`).toContain(kind)
      }
    }
  })

  it('keep the open eyes to one family: only the shut eyes are shared', () => {
    const lived = faceCatalog.eyeFamilies.flatMap(({ members }) =>
      members
        .filter(({ kind }) => kind !== 'shut' && kind !== 'smile')
        .map(({ variant }) => variant),
    )

    expect(isUnique(lived)).toBe(true)
  })

  it('give each family an open eye and a way to shut', () => {
    for (const { key, members } of faceCatalog.eyeFamilies) {
      expect(
        members.some(({ kind }) => kind === 'open'),
        key,
      ).toBe(true)
      expect(
        members.some(({ kind }) => kind === 'shut'),
        key,
      ).toBe(true)
    }
  })

  it('turn upside down only an eye of a smile', () => {
    for (const { members } of faceCatalog.eyeFamilies) {
      for (const { kind, isFlipped } of members) expect(isFlipped === true).toBe(kind === 'smile')
    }
  })
})

describe('the looks of the faces of people', () => {
  it('has a look for each mood', () => {
    expect(Object.keys(humanLooks)).toEqual([...moods])
  })

  it('has steps for each eye, each with a time, and a kind of eye that the catalog has', () => {
    for (const [mood, look] of Object.entries(humanLooks)) {
      for (const step of [...look.eyes.left, ...look.eyes.right]) {
        expect(step.ms, mood).toBeGreaterThan(0)
        expect(['rest', ...faceCatalog.eyeKinds], mood).toContain(step.role)
        if (step.look !== undefined) expect(Object.keys(humanLookOffsets)).toContain(step.look)
      }
      expect(look.eyes.left.length, mood).toBeGreaterThan(0)
      expect(look.eyes.right.length, mood).toBeGreaterThan(0)
    }
  })

  it('draws the mouth of a mood with a variant that the catalog has', () => {
    for (const [mood, look] of Object.entries(humanLooks)) {
      if (look.mouth !== null) expect(variantOf('mouth', look.mouth), mood).toBeDefined()
    }
  })
})
