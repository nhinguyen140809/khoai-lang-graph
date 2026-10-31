import { describe, expect, it } from 'vitest'

import { mePasswordFixture } from '../me.fixtures'
import { validateChangePasswordBody, validateUpdateMeBody } from '../me.validators'
import {
  acceptedUpdateMeBodies,
  refusedPasswordBodies,
  refusedUpdateMeBodies,
} from './me.validators.data'

describe('validateUpdateMeBody', () => {
  it.each(acceptedUpdateMeBodies)('takes $name', ({ body }) => {
    expect(validateUpdateMeBody(body)).toEqual({ fields: body })
  })

  it.each(refusedUpdateMeBodies)('refuses $name', ({ body, problems }) => {
    expect(validateUpdateMeBody(body)).toEqual({ problems })
  })
})

describe('validateChangePasswordBody', () => {
  it('takes the new password once the current one is right', () => {
    const body = { current_password: mePasswordFixture, new_password: 'long-enough-1' }

    expect(validateChangePasswordBody(body)).toEqual({ password: 'long-enough-1' })
  })

  it.each(refusedPasswordBodies)('refuses $name', ({ body, problems }) => {
    expect(validateChangePasswordBody(body)).toEqual({ problems })
  })
})
