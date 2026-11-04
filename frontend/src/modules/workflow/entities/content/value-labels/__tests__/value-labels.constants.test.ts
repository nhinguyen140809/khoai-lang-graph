import { describe, expect, it } from 'vitest'

import { artifactKindFixtures } from '@/mocks/workflow/artifact-kinds.fixtures'
import { assertPresent, isOneOf } from '@/shared/lib/guards'

import { contentFields } from '../../fields/content-fields.utils'
import { valueLabelsByField } from '../value-labels.constants'
import { valueTonesByField } from '../value-tones.constants'

// The widgets whose values are chosen from a fixed list: a select, a badge or a separator, not a
// value list and not the values of another field.
const fixedChoiceWidgets = ['select', 'badge', 'separator'] as const

/** Every field of the kinds that offers a fixed list of values: not a value list, not the values of another field. */
const fixedSelects = artifactKindFixtures.artifact_kinds
  .flatMap((artifactKind) => [artifactKind, ...artifactKind.item_kinds])
  .flatMap(({ schema }) =>
    contentFields(schema).filter(
      (field) =>
        isOneOf(fixedChoiceWidgets, field.widget) &&
        field.valueList === null &&
        field.allowedValuesFrom === null &&
        field.options.length > 0,
    ),
  )

describe('valueLabelsByField', () => {
  it('has a label for every value of every fixed select of the kinds', () => {
    const missing = fixedSelects.flatMap((field) =>
      field.options
        .filter((option) => valueLabelsByField[field.path]?.[option] === undefined)
        .map((option) => `${field.path}: ${option}`),
    )

    expect(missing).toEqual([])
  })

  it('has labels only for fields that exist', () => {
    const paths = new Set(fixedSelects.map(({ path }) => path))

    expect(Object.keys(valueLabelsByField).filter((path) => !paths.has(path))).toEqual([])
  })
})

describe('valueTonesByField', () => {
  it('names each field by its kind and its field, as the labels do', () => {
    const paths = Object.keys(valueTonesByField)

    expect(paths.length).toBeGreaterThan(0)
    expect(paths.every((path) => /^[a-z_]+\.[a-z_]+$/.test(path))).toBe(true)
  })

  it('names a badge field of the kinds, and tones every value it offers', () => {
    const badges = fixedSelects.filter((field) => field.widget === 'badge')

    for (const path of Object.keys(valueTonesByField)) {
      const field = assertPresent(
        badges.find(({ path: at }) => at === path),
        `No badge at ${path}`,
      )
      for (const value of Object.keys(valueTonesByField[path] ?? {})) {
        expect(field.options, `${path} does not offer ${value}`).toContain(value)
      }
    }
  })
})
