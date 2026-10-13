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
  it('names the modifier of the platform, and a letter in capitals', () => {
    expect(hotkeyLabel({ key: 'b', mod: true }, 'Ctrl')).toBe('Ctrl+B')
    expect(hotkeyLabel({ key: 'b', mod: true }, 'Cmd')).toBe('Cmd+B')
    expect(hotkeyLabel({ key: 'Escape' }, 'Cmd')).toBe('Escape')
  })

  it('names Ctrl on every platform for a hotkey that needs it', () => {
    expect(hotkeyLabel({ key: '`', ctrl: true }, 'Cmd')).toBe('Ctrl+`')
  })
})
