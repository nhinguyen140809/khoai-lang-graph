import { describe, expect, it } from 'vitest'

import type { PaletteCommand } from '../command.types'
import { ariaKeyShortcuts, commandGroups, hotkeyKeys, hotkeyLabel } from '../command.utils'

function command(id: string, group: string): PaletteCommand {
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

describe('hotkeyKeys', () => {
  it('lists the keys held, the modifier first', () => {
    expect(hotkeyKeys({ key: 'k', mod: true }, 'Cmd')).toEqual(['Cmd', 'K'])
    expect(hotkeyKeys({ key: '`', ctrl: true }, 'Cmd')).toEqual(['Ctrl', '`'])
  })
})

describe('ariaKeyShortcuts', () => {
  it('names both keys that the modifier stands for', () => {
    expect(ariaKeyShortcuts({ key: 'k', mod: true })).toBe('Control+K Meta+K')
    expect(ariaKeyShortcuts({ key: '`', ctrl: true })).toBe('Control+`')
  })
})
