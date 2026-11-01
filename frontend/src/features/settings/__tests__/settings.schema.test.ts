import { describe, expect, it } from 'vitest'

import { modelChoicesFormSchema, passwordFormSchema, profileFormSchema } from '../settings.schema'

describe('profileFormSchema', () => {
  it('trims the name and sends an empty picture as null', () => {
    expect(profileFormSchema.parse({ display_name: ' Linh ', avatar_url: ' ' })).toEqual({
      display_name: 'Linh',
      avatar_url: null,
    })
  })
})

describe('passwordFormSchema', () => {
  it('sends the passwords without the one typed again', () => {
    expect(
      passwordFormSchema.parse({
        current_password: 'old secret',
        new_password: 'new secret',
        again: 'new secret',
      }),
    ).toEqual({ current_password: 'old secret', new_password: 'new secret' })
  })

  it('names the field of each problem', () => {
    const result = passwordFormSchema.safeParse({
      current_password: '',
      new_password: 'short',
      again: 'other',
    })

    expect(result.error?.issues.map(({ path, message }) => [path, message])).toEqual([
      [['current_password'], 'Enter your current password.'],
      [['new_password'], 'Use at least 8 characters.'],
      [['again'], 'The two passwords differ.'],
    ])
  })
})

describe('modelChoicesFormSchema', () => {
  it('sends the chosen models, with an empty temperature as null', () => {
    expect(
      modelChoicesFormSchema.parse({
        choices: {
          analyst: { model_id: 'model-a', temperature: '0.4' },
          writer: { model_id: 'model-b', temperature: '' },
          critic: { model_id: '', temperature: '1' },
        },
      }),
    ).toEqual([
      { agent_role: 'analyst', model_id: 'model-a', temperature: 0.4 },
      { agent_role: 'writer', model_id: 'model-b', temperature: null },
    ])
  })

  it('keeps the temperature from 0 to 2', () => {
    const result = modelChoicesFormSchema.safeParse({
      choices: { analyst: { model_id: 'model-a', temperature: '3' } },
    })

    expect(result.error?.issues.map(({ path, message }) => [path, message])).toEqual([
      [['choices', 'analyst', 'temperature'], 'Enter a number from 0 to 2.'],
    ])
  })
})
