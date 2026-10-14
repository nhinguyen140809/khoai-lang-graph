import { describe, expect, it } from 'vitest'

import { routes } from '../routes.utils'

describe('routes', () => {
  it('gives the pages without parameters', () => {
    expect(routes.home()).toBe('/')
    expect(routes.projects()).toBe('/projects')
  })

  it('gives the account pages, which return to the page asked for', () => {
    expect(routes.signIn('/settings')).toBe('/login?next=%2Fsettings')
    expect(routes.register()).toBe('/register')
  })
})

describe('routes.project', () => {
  it('encodes each part of the address of a page of a project', () => {
    expect(routes.project('p 1').item('i/1')).toBe('/projects/p%201/artifacts/items/i%2F1')
    expect(routes.project('p1').thread('t1')).toBe('/projects/p1/console/t1')
  })

  it('writes the query parameters that a page reads, and leaves out those not given', () => {
    const project = routes.project('p1')

    expect(project.run('r1')).toBe('/projects/p1/workflow/r1')
    expect(project.run('r1', 's 1')).toBe('/projects/p1/workflow/r1?step=s+1')
    expect(project.runNode('r1', 'n1')).toBe('/projects/p1/workflow/r1?node=n1')
    expect(project.traceability({ view: 'issues', gap: 'g1' })).toBe(
      '/projects/p1/traceability?view=issues&gap=g1',
    )
    expect(project.artifacts()).toBe('/projects/p1/artifacts')
    expect(project.artifacts({ exporting: true })).toBe('/projects/p1/artifacts?export=')
  })

  it('opens the settings without a section on their first one', () => {
    expect(routes.project('p1').settings()).toBe('/projects/p1/settings')
    expect(routes.project('p1').settings('runs')).toBe('/projects/p1/settings?section=runs')
    expect(routes.settings()).toBe('/settings')
    expect(routes.settings('usage')).toBe('/settings?section=usage')
  })
})
