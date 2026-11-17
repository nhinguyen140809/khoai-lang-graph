import { describe, expect, it } from 'vitest'

import { exportFileLabel, exportToastId } from '../export.utils'
import { fileLabelCases } from './export.utils.data'

describe('exportFileLabel', () => {
  it.each(fileLabelCases)('names $name', ({ template, format, label }) => {
    expect(exportFileLabel(template, format)).toBe(label)
  })
})

describe('exportToastId', () => {
  it('gives one toast to each export', () => {
    expect(exportToastId('e1')).toBe('export:e1')
    expect(exportToastId('e2')).not.toBe(exportToastId('e1'))
  })
})
