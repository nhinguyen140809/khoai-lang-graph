import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { forgetPromptDraft } from '../../prompt-draft.store'
import { usePromptDraft } from '../usePromptDraft'

describe('usePromptDraft', () => {
  it('keeps what is written and gives it back when the prompt shows again', () => {
    const first = renderHook(() => usePromptDraft('chat:a'))
    act(() => {
      first.result.current[1]('A mentor app')
    })
    first.unmount()

    const second = renderHook(() => usePromptDraft('chat:a'))

    expect(second.result.current[0]).toBe('A mentor app')
  })

  it('keeps a draft for each name', () => {
    const view = renderHook(({ name }) => usePromptDraft(name), {
      initialProps: { name: 'chat:a' },
    })
    act(() => {
      view.result.current[1]('First')
    })

    view.rerender({ name: 'chat:b' })
    expect(view.result.current[0]).toBe('')
    view.rerender({ name: 'chat:a' })

    expect(view.result.current[0]).toBe('First')
  })

  it('forgets the draft when the text is blank, and when it is forgotten', () => {
    const view = renderHook(() => usePromptDraft('chat:a'))
    act(() => {
      view.result.current[1]('Something')
    })

    act(() => {
      view.result.current[1]('  ')
    })
    expect(view.result.current[0]).toBe('')

    act(() => {
      view.result.current[1]('Something else')
    })
    act(() => {
      forgetPromptDraft('chat:a')
    })

    expect(view.result.current[0]).toBe('')
  })

  it('asks the browser before a reload while there is text, and not otherwise', () => {
    const view = renderHook(() => usePromptDraft('chat:a'))
    const isAskingBeforeLeaving = () => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(isAskingBeforeLeaving()).toBe(false)

    act(() => {
      view.result.current[1]('A mentor app')
    })
    expect(isAskingBeforeLeaving()).toBe(true)

    act(() => {
      view.result.current[1]('')
    })
    expect(isAskingBeforeLeaving()).toBe(false)
  })
})
