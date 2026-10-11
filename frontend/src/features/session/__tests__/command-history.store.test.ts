import { beforeEach, describe, expect, it } from 'vitest'

import { useCommandHistoryStore } from '../command-history.store'

beforeEach(() => {
  useCommandHistoryStore.setState({ commands: {} })
})

describe('useCommandHistoryStore', () => {
  it('keeps the commands of each session apart, oldest first', () => {
    const { record } = useCommandHistoryStore.getState()

    record('a', 'stop')
    record('a', 'expand')
    record('b', 'retry')

    const { commands } = useCommandHistoryStore.getState()
    expect(commands.a?.map(({ name }) => name)).toEqual(['stop', 'expand'])
    expect(commands.b?.map(({ name }) => name)).toEqual(['retry'])
  })

  it('drops the oldest commands of a session past 200', () => {
    const { record } = useCommandHistoryStore.getState()

    for (let index = 0; index < 205; index += 1) record('a', 'expand')

    expect(useCommandHistoryStore.getState().commands.a).toHaveLength(200)
  })
})
