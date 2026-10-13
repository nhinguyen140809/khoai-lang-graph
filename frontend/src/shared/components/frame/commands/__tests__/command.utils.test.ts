import { describe, expect, it } from 'vitest'

import type { PaletteCommand } from '../command.types'
import { commandGroups } from '../command.utils'

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
