import { describe, expect, it } from 'vitest'

import {
  exportBodiesOf,
  exportContents,
  exportFileLabel,
  exportToastId,
  startFormatsOf,
} from '../export.utils'
import { bodiesCases, contentsCases, fileLabelCases, startFormatCases } from './export.utils.data'

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

describe('exportContents', () => {
  it.each(contentsCases)('reads $name', ({ kinds, line }) => {
    const titles = new Map([
      ['persona_catalog', 'Persona catalog'],
      ['interview_transcript', 'Interview transcript'],
    ])
    expect(exportContents({ artifact_kinds: kinds }, titles)).toBe(line)
  })
})

describe('startFormatsOf', () => {
  it.each(startFormatCases)('gives $name', ({ templates, start }) => {
    expect(startFormatsOf(templates)).toEqual(start)
  })
})

describe('exportBodiesOf', () => {
  it.each(bodiesCases)('asks for $name', ({ values, bodies }) => {
    expect(exportBodiesOf(values)).toEqual(bodies)
  })
})
