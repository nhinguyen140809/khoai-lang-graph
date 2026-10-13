import { describe, expect, it } from 'vitest'

import {
  artifactsExportHref,
  itemHref,
  runHref,
  runNodeHref,
  settingsHref,
  threadHref,
  traceabilityHref,
} from '../routes.utils'

describe('routes', () => {
  it('encodes each part of the address of a page of a project', () => {
    expect(itemHref('p 1', 'i/1')).toBe('/projects/p%201/artifacts/items/i%2F1')
    expect(threadHref('p1', 't1')).toBe('/projects/p1/console/t1')
  })

  it('writes the query parameters that a page reads, and leaves out those not given', () => {
    expect(runHref('p1', 'r1')).toBe('/projects/p1/workflow/r1')
    expect(runHref('p1', 'r1', 's 1')).toBe('/projects/p1/workflow/r1?step=s+1')
    expect(runNodeHref('p1', 'r1', 'n1')).toBe('/projects/p1/workflow/r1?node=n1')
    expect(traceabilityHref('p1', { view: 'issues', gap: 'g1' })).toBe(
      '/projects/p1/traceability?view=issues&gap=g1',
    )
    expect(artifactsExportHref('p1')).toBe('/projects/p1/artifacts?export=')
  })

  it('opens the settings without a section on their first one', () => {
    expect(settingsHref('p1')).toBe('/projects/p1/settings')
    expect(settingsHref('p1', 'runs')).toBe('/projects/p1/settings?section=runs')
  })
})
