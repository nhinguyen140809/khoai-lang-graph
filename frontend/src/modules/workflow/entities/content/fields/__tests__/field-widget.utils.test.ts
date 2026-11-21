import { describe, expect, it } from 'vitest'

import { isOneLineField, isSeparatorField } from '../field-widget.utils'
import { widgetRuleCases } from './content-fields.utils.data'

describe('the rules of each widget', () => {
  it.each(widgetRuleCases)('reads the rules of $widget', ({ widget, isOneLine, isSeparator }) => {
    expect(isOneLineField({ widget })).toBe(isOneLine)
    expect(isSeparatorField({ widget })).toBe(isSeparator)
  })
})
