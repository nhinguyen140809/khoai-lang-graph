import { describe, expect, it } from 'vitest'

import { exportTemplatesOf } from '../export-templates.utils'
import { definedTemplates, templatesOfCases } from './export-templates.utils.data'

describe('exportTemplatesOf', () => {
  it.each(templatesOfCases)('offers $name', ({ kind, keys }) => {
    expect(exportTemplatesOf(definedTemplates, kind).map(({ key }) => key)).toEqual(keys)
  })
})
