import { describe, expect, it } from 'vitest'

import type { Command } from '../command.types'
import { commandGroups, hotkeyLabel } from '../command.utils'

function command(id: string, group: string): Command {
  return { id, label: id, group }
}

describe('commandGroups', () => {
  it('orders the groups by name and keeps the order of the commands in a group', () => {
    const groups = commandGroups([
      [command('toggle', 'View'), command('console', 'Show')],
      [command('dark', 'View'), command('light', 'View')],
    ])

    expect(groups.map(({ heading, commands }) => [heading, commands.map(({ id }) => id)])).toEqual([
      ['Show', ['console']],
      ['View', ['toggle', 'dark', 'light']],
    ])
  })
})

describe('hotkeyLabel', () => {
  it('writes the modifier as Ctrl and a letter in capitals', () => {
    expect(hotkeyLabel({ key: 'b', mod: true })).toBe('Ctrl+B')
    expect(hotkeyLabel({ key: 'Escape' })).toBe('Escape')
  })
})
