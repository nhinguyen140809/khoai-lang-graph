import { describe, expect, it } from 'vitest'

import { runEventSchemas, runEventTypes } from '../run-events.types'

describe('step_note', () => {
  it('is an event of the stream, with the step, the kind and the Markdown text of the note', () => {
    expect(runEventTypes).toContain('step_note')
    expect(
      runEventSchemas.step_note.parse({ step_id: 's1', kind: 'finding', text: 'A **gap**.' }),
    ).toEqual({ step_id: 's1', kind: 'finding', text: 'A **gap**.' })
  })

  it('refuses a kind it does not know', () => {
    expect(
      runEventSchemas.step_note.safeParse({ step_id: 's1', kind: 'shouting', text: 'x' }).success,
    ).toBe(false)
  })
})
