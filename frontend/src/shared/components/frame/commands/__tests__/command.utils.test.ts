import { describe, expect, it } from 'vitest'

import { commandGroups, groupsBySearch, shownCommandsKey } from '../command.utils'
import {
  commandGroupCases,
  groupsBySearchCases,
  shownCommand,
  shownKeyCases,
} from './command.utils.data'

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

describe('groupsBySearch', () => {
  it.each(groupsBySearchCases)('$name', ({ groups, search, headings }) => {
    expect(groupsBySearch(groups, search).map(({ heading }) => heading)).toEqual(headings)
  })
})

describe('shownKey', () => {
  it.each(shownKeyCases)('$name', ({ command, same }) => {
    expect(shownCommandsKey([command]) === shownCommandsKey([shownCommand])).toBe(same)
  })
})
