import { describe, expect, it } from 'vitest'

import { artifactsInProgress } from '../artifacts-in-progress.utils'
import { progressCases } from './artifacts-in-progress.utils.data'

describe('artifactsInProgress', () => {
  it.each(progressCases)('$name', ({ ids, event, result }) => {
    expect([...artifactsInProgress(new Set(ids), event)]).toEqual(result)
  })

  it('gives back the same set when nothing changes', () => {
    const ids = new Set(['a'])

    expect(
      artifactsInProgress(ids, { id: '1', type: 'token', data: { node: 'n', text: 't' } }),
    ).toBe(ids)
  })
})
