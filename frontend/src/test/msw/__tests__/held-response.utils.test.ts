import { describe, expect, it } from 'vitest'

import { expectStillPending } from '../../steps'
import { holdResponse } from '../held-response.utils'

describe('holdResponse', () => {
  it('holds a handler until the test releases it', async () => {
    const { held, release } = holdResponse()
    const answered = held.then(() => 'answered')

    await expectStillPending(answered, 10)
    release()

    expect(await answered).toBe('answered')
  })
})
