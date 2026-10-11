import { describe, expect, it } from 'vitest'

import { featureHref, featureOfPathname, featureTabGroup } from '../activity-bar.config'

describe('featureOfPathname', () => {
  it('is the feature segment of a project page', () => {
    expect(featureOfPathname('/projects/p1/console')).toBe('console')
    expect(featureOfPathname('/projects/p1/artifacts/items/i1')).toBe('artifacts')
  })

  it('is null outside a feature', () => {
    expect(featureOfPathname('/projects')).toBeNull()
    expect(featureOfPathname('/projects/p1')).toBeNull()
    expect(featureOfPathname('/projects/p1/unknown')).toBeNull()
  })
})

describe('featureHref and featureTabGroup', () => {
  it('build the address and the tab group of a feature', () => {
    expect(featureHref('p 1', 'workflow')).toBe('/projects/p%201/workflow')
    expect(featureTabGroup('p1', 'console')).toBe('p1:console')
  })
})
