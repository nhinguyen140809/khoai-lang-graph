import { describe, expect, it } from 'vitest'

import { fieldWidgets } from '../content-fields.types'
import { widgetValueRules } from '../widget-value-rules.utils'

describe('widgetValueRules', () => {
  it('has rules for every widget that the schema can name', () => {
    expect(Object.keys(widgetValueRules).toSorted()).toEqual([...fieldWidgets].toSorted())
  })

  it.each([
    ['list', true],
    ['tags', true],
    ['object-list', true],
    ['text', false],
    ['number', false],
  ] as const)('says if %s has a list value: %s', (widget, hasListValue) => {
    expect(widgetValueRules[widget].hasListValue).toBe(hasListValue)
  })
})
