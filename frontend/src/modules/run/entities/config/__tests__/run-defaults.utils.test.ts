import { describe, expect, it } from 'vitest'

import { assertPresent } from '@/shared/lib/guards'

import {
  isRunDefaultsEmpty,
  runDefaultsFieldValuesOf,
  selectedCheckpoints,
  selectKeyOf,
  selectValueOf,
  toggledCheckpoints,
  toRunDefaults,
} from '../run-defaults.utils'
import {
  choiceField,
  emptyCases,
  parameterFields,
  selectedCases,
  selectKeyCases,
  selectValueCases,
  sentDefaultsCases,
  toggleCases,
  valuesCases,
} from './run-defaults.utils.data'

describe('runDefaultsFieldValuesOf', () => {
  it.each(valuesCases)('shows $name', ({ defaults, values }) => {
    expect(runDefaultsFieldValuesOf(defaults, parameterFields)).toEqual(values)
  })
})

describe('toRunDefaults', () => {
  it.each(sentDefaultsCases)('sends $name', ({ values, defaults }) => {
    expect(toRunDefaults(values, parameterFields)).toEqual(defaults)
  })
})

describe('toggledCheckpoints', () => {
  it.each(toggleCases)('lists the reviews after $name', ({ current, id, isOn, result }) => {
    expect(toggledCheckpoints(current, id, isOn)).toEqual(result)
  })
})

describe('isRunDefaultsEmpty', () => {
  it.each(emptyCases)('says if $name is empty', ({ defaults, isEmpty }) => {
    expect(isRunDefaultsEmpty(defaults)).toBe(isEmpty)
  })
})

describe('selectedCheckpoints', () => {
  it.each(selectedCases)('reads $name', ({ value, selected }) => {
    expect(selectedCheckpoints(value)).toEqual(selected)
  })
})

describe('selectKeyOf', () => {
  it.each(selectKeyCases)('gives the key for $name', ({ value, key }) => {
    expect(selectKeyOf(assertPresent(choiceField, 'No choice field'), value)).toBe(key)
  })
})

describe('selectValueOf', () => {
  it.each(selectValueCases)('gives the value for $name', ({ key, value }) => {
    expect(selectValueOf(assertPresent(choiceField, 'No choice field'), key)).toBe(value)
  })
})
