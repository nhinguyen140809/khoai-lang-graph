import { describe, expect, it } from 'vitest'

import { commandGroups } from '../command.utils'
import { commandGroupCases } from './command.utils.data'

describe('commandGroups', () => {
  it.each(commandGroupCases)('$name', ({ sources, groups }) => {
    expect(
      commandGroups(sources).map(({ heading, commands }) => [
        heading,
        commands.map(({ id }) => id),
      ]),
    ).toEqual(groups)
  })
})
