import { describe, expect, it } from 'vitest'

import { draftsWith } from '../prompt-draft.utils'

describe('draftsWith', () => {
  it('sets the text of a prompt, and keeps the drafts of the others', () => {
    expect(draftsWith({ a: 'one' }, 'b', 'two')).toEqual({ a: 'one', b: 'two' })
  })

  it('is the same drafts when the text does not change, so that nothing is drawn again', () => {
    const drafts = { a: 'one' }

    expect(draftsWith(drafts, 'a', 'one')).toBe(drafts)
    expect(draftsWith(drafts, 'b', '  ')).toBe(drafts)
  })

  it('takes the prompt out of the drafts when its text is blank', () => {
    expect(draftsWith({ a: 'one', b: 'two' }, 'a', ' \n')).toEqual({ b: 'two' })
  })
})
