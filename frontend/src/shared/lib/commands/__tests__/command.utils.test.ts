import { describe, expect, it, vi } from 'vitest'

import type { Command } from '../command.types'
import { runnableCommand, shownCommandsKey } from '../command.utils'
import { shownCommand, shownKeyCases } from './command.utils.data'

describe('shownCommandsKey', () => {
  it.each(shownKeyCases)('$name', ({ command, same }) => {
    expect(shownCommandsKey([command]) === shownCommandsKey([shownCommand])).toBe(same)
  })
})

describe('runnableCommand', () => {
  const command = (id: string, run?: Command['run']): Command => ({ id, ...(run && { run }) })

  it('gives the command of the id that runs', () => {
    const open = vi.fn()

    const found = runnableCommand([[command('a'), command('open', open)]], 'open')

    found?.run({ artifact_id: 'x' })
    expect(open).toHaveBeenCalledExactlyOnceWith({ artifact_id: 'x' })
  })

  it('gives none for an id that nothing registered, or that only informs', () => {
    expect(runnableCommand([[command('a')]], 'a')).toBeUndefined()
    expect(runnableCommand([[command('a', vi.fn())]], 'b')).toBeUndefined()
    expect(runnableCommand([], 'a')).toBeUndefined()
  })

  it('gives the first of the components that registered the id', () => {
    const first = vi.fn()
    const second = vi.fn()

    runnableCommand([[command('open', first)], [command('open', second)]], 'open')?.run({})

    expect(first).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
  })
})
