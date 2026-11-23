import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { UiCommand } from '@/modules/thread/entities'
import { useCommands } from '@/shared/lib/commands'
import { catalogKeys } from '@/test/docs'

import { uiCommandIds } from '../ui-commands.constants'
import { runUiCommands } from '../ui-commands.utils'

function command(fields: Partial<UiCommand> & { command: string }): UiCommand {
  return { artifact_id: null, item_id: null, label: null, ...fields }
}

describe('the ids of the UI commands', () => {
  // The catalog of the docs is the list that the server checks an answer against: a key added there
  // fails here until the page has an id for it, and one here that the docs do not list fails too.
  it('are the commands of the catalog in the docs', () => {
    expect(Object.values(uiCommandIds).sort()).toEqual(
      catalogKeys('commands.catalog.json', 'commands').sort(),
    )
  })
})

describe('runUiCommands', () => {
  it('runs each command as the one that a mounted component registered, in the order asked, with what it names', () => {
    const calls: string[] = []
    const open = vi.fn((args: unknown) => {
      calls.push(`open:${JSON.stringify(args)}`)
    })
    const settings = vi.fn(() => {
      calls.push('settings')
    })
    renderHook(() => {
      useCommands([
        { id: uiCommandIds.openDocument, run: open },
        { id: uiCommandIds.openSettings, run: settings },
      ])
    })

    runUiCommands(
      [
        command({ command: uiCommandIds.openSettings }),
        command({ command: uiCommandIds.openDocument, artifact_id: 'a1', label: 'Plan' }),
      ],
      't1',
    )

    expect(calls).toEqual([
      'settings',
      'open:{"artifact_id":"a1","item_id":null,"label":"Plan","thread_id":"t1"}',
    ])
  })

  it('skips a command that nothing registered, and one of an id it does not know', () => {
    const open = vi.fn()
    renderHook(() => {
      useCommands([{ id: uiCommandIds.openDocument, run: open }])
    })

    runUiCommands(
      [
        command({ command: 'fly' }),
        command({ command: 'toString' }),
        command({ command: uiCommandIds.openReview }),
      ],
      't1',
    )

    expect(open).not.toHaveBeenCalled()
  })
})
