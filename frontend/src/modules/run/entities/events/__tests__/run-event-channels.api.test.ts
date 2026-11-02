import { describe, expect, it, vi } from 'vitest'

import { openedEventSources } from '@/test/event-source'

import { listenToRun } from '../run-event-channels.api'
import { streamReopenMs } from '../run-events.constants'
import type { RunChannelSignal } from '../run-events.types'

function recorder() {
  const signals: RunChannelSignal[] = []
  return {
    signals,
    listener: (signal: RunChannelSignal) => {
      signals.push(signal)
    },
    types: () => signals.map((signal) => (signal.kind === 'event' ? signal.event.type : 'failed')),
  }
}

describe('listenToRun', () => {
  it('opens one stream for every listener of a run, from its first event', () => {
    const stops = [listenToRun('r1', recorder().listener), listenToRun('r1', recorder().listener)]

    expect(openedEventSources()).toHaveLength(1)
    expect(openedEventSources()[0]?.url).toMatch(/\/runs\/r1\/stream$/)
    for (const stop of stops) stop()
  })

  it('gives every listener the events of the stream', () => {
    const first = recorder()
    const second = recorder()
    const stops = [listenToRun('r1', first.listener), listenToRun('r1', second.listener)]

    openedEventSources()[0]?.emit('node_start', { node: 'analyst' }, '1')

    expect(first.types()).toEqual(['node_start'])
    expect(second.types()).toEqual(['node_start'])
    for (const stop of stops) stop()
  })

  it('gives a listener that joins late the events read already', () => {
    const early = recorder()
    const stopEarly = listenToRun('r1', early.listener)
    openedEventSources()[0]?.emit('node_start', { node: 'analyst' }, '1')
    openedEventSources()[0]?.emit('node_end', { node: 'analyst' }, '2')

    const late = recorder()
    const stopLate = listenToRun('r1', late.listener)

    expect(late.types()).toEqual(['node_start', 'node_end'])
    stopEarly()
    stopLate()
  })

  it('leaves out the events up to the id given by `after`', () => {
    const early = recorder()
    const stopEarly = listenToRun('r1', early.listener)
    openedEventSources()[0]?.emit('node_start', { node: 'analyst' }, '1')
    openedEventSources()[0]?.emit('node_end', { node: 'analyst' }, '2')

    const late = recorder()
    const stopLate = listenToRun('r1', late.listener, { after: 1 })

    expect(late.types()).toEqual(['node_end'])
    stopEarly()
    stopLate()
  })

  it('closes the stream when the last listener leaves, and not before', () => {
    const stopFirst = listenToRun('r1', recorder().listener)
    const stopSecond = listenToRun('r1', recorder().listener)

    stopFirst()
    expect(openedEventSources()[0]?.closed).toBe(false)

    stopSecond()
    expect(openedEventSources()[0]?.closed).toBe(true)
  })

  it('opens the stream again for a listener that comes after the last one left', () => {
    listenToRun('r1', recorder().listener)()

    const stop = listenToRun('r1', recorder().listener)

    expect(openedEventSources()).toHaveLength(2)
    stop()
  })

  it('closes the stream after the last event of the run, and opens it no more', () => {
    vi.useFakeTimers()
    const stop = listenToRun('r1', recorder().listener)

    openedEventSources()[0]?.emit('done', {}, '5')
    vi.advanceTimersByTime(streamReopenMs)

    expect(openedEventSources()[0]?.closed).toBe(true)
    expect(openedEventSources()).toHaveLength(1)
    stop()
    vi.useRealTimers()
  })

  it('tells the listeners that the connection failed and opens it after the last event read', () => {
    vi.useFakeTimers()
    const watcher = recorder()
    const stop = listenToRun('r1', watcher.listener)
    openedEventSources()[0]?.emit('node_start', { node: 'analyst' }, '7')

    openedEventSources()[0]?.fail()
    vi.advanceTimersByTime(streamReopenMs)

    expect(watcher.types()).toEqual(['node_start', 'failed'])
    expect(openedEventSources()).toHaveLength(2)
    expect(openedEventSources()[1]?.url).toMatch(/after=7$/)
    stop()
    vi.useRealTimers()
  })

  it('does not open the stream again when the last listener left after the failure', () => {
    vi.useFakeTimers()
    const stop = listenToRun('r1', recorder().listener)
    openedEventSources()[0]?.fail()

    stop()
    vi.advanceTimersByTime(streamReopenMs)

    expect(openedEventSources()).toHaveLength(1)
    vi.useRealTimers()
  })

  it('drops an event that does not parse', () => {
    const watcher = recorder()
    const stop = listenToRun('r1', watcher.listener)

    openedEventSources()[0]?.emit('node_start', { node: 4 }, '1')

    expect(watcher.signals).toEqual([])
    stop()
  })
})
