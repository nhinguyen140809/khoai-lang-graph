import { describe, expect, it } from 'vitest'

import { plainTextOf } from '../plain-text.utils'

describe('plainTextOf', () => {
  it.each([
    ['**Done** with the _analysis_', 'Done with the analysis'],
    ['See [the brief](https://example.com/brief) now', 'See the brief now'],
    ['# Title\n\n- one\n- two\n\n> quoted', 'Title one two quoted'],
    ['Before\n```ts\nconst a = 1\n```\nafter', 'Before after'],
    ['Use `npm test` first', 'Use npm test first'],
    ['The item_kind of my_file.md stays', 'The item_kind of my_file.md stays'],
    ['__init__ and _emphasis_ go', 'init and emphasis go'],
  ])('reads %j as %j', (markdown, text) => {
    expect(plainTextOf(markdown)).toBe(text)
  })
})
