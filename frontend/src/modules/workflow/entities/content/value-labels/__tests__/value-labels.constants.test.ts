import { describe, expect, it } from 'vitest'

import { artifactKindFixtures } from '@/mocks/workflow/artifact-kinds.fixtures'

import { contentFields } from '../../fields/content-fields.utils'
import { valueLabelsByField } from '../value-labels.constants'

/** Every select of the kinds that offers a fixed list of values: not a value list, not the values of another field. */
const fixedSelects = artifactKindFixtures.artifact_kinds
  .flatMap((artifactKind) => [artifactKind, ...artifactKind.item_kinds])
  .flatMap(({ schema }) =>
    contentFields(schema).filter(
      (field) =>
        field.widget === 'select' &&
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
