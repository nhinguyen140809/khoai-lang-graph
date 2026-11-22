import { describe, expect, it } from 'vitest'

import { pageTitle } from '../title.utils'

describe('pageTitle', () => {
  it('puts the name of the page before the name of the app', () => {
    expect(pageTitle('Mentor platform')).toBe('Mentor platform | khoailanggraph')
  })

  it.each([null, undefined, ''])('is the name of the app alone for the name %j', (name) => {
    expect(pageTitle(name)).toBe('khoailanggraph')
  })
})
