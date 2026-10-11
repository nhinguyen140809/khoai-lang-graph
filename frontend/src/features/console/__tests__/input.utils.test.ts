import { describe, expect, it } from 'vitest'

import {
  commandPrefix,
  insertMention,
  itemLabel,
  matchingCommands,
  mentionAtCursor,
} from '../input.utils'

describe('commandPrefix', () => {
  it('is what follows a slash at the start, and null for any other text', () => {
    expect(commandPrefix('/')).toBe('')
    expect(commandPrefix('/st')).toBe('st')
    expect(commandPrefix('hello /st')).toBeNull()
    expect(commandPrefix('/stop now')).toBeNull()
  })
})

describe('matchingCommands', () => {
  it('lists the commands that start with the prefix', () => {
    expect(matchingCommands('r').map(({ name }) => name)).toEqual(['retry', 'run-settings'])
    expect(matchingCommands('e').map(({ name }) => name)).toEqual(['expand', 'export'])
    expect(matchingCommands('')).toHaveLength(6)
    expect(matchingCommands('x')).toEqual([])
  })
})

describe('mentionAtCursor', () => {
  it('finds the @ word that ends at the cursor', () => {
    expect(mentionAtCursor('ask about @REQ', 14)).toEqual({ query: 'REQ', start: 10 })
    expect(mentionAtCursor('@', 1)).toEqual({ query: '', start: 0 })
    expect(mentionAtCursor('mail me@x', 9)).toBeNull()
    expect(mentionAtCursor('@REQ-001 done', 13)).toBeNull()
  })
})

describe('insertMention', () => {
  it('replaces the word with the key and a space, and moves the cursor after it', () => {
    const token = { query: 'RE', start: 6 }
    expect(insertMention('about @RE please', token, 9, 'REQ-001')).toEqual({
      text: 'about @REQ-001 please',
      cursor: 15,
    })
  })
})

describe('itemLabel', () => {
  it('is the title, the name or the statement, else empty', () => {
    expect(itemLabel({ title: 'Search mentors' })).toBe('Search mentors')
    expect(itemLabel({ name: 'Student' })).toBe('Student')
    expect(itemLabel({ other: 1 })).toBe('')
  })
})
