import { describe, expect, it } from 'vitest'

import { refusalMessageOf, splitSourceFiles } from '../source-files.utils'

function file(name: string, size = 10) {
  return new File([new Uint8Array(size)], name)
}

describe('splitSourceFiles', () => {
  it('keeps the files that a source can be and names what is wrong with the others', () => {
    const notes = file('notes.md')
    const scan = file('scan.pdf')
    const big = file('dump.json', 10 * 1024 * 1024 + 1)

    const { accepted, refused } = splitSourceFiles([notes, scan, big])

    expect(accepted).toEqual([notes])
    expect(refused).toEqual([
      { file: scan, problem: 'unsupported_format' },
      { file: big, problem: 'too_large' },
    ])
  })
})

describe('refusalMessageOf', () => {
  it('names the file and says what is wrong with it', () => {
    expect(refusalMessageOf({ name: 'scan.pdf' }, 'unsupported_format')).toContain('scan.pdf')
    expect(refusalMessageOf({ name: 'dump.json' }, 'too_large')).toBe('dump.json is over 10 MB.')
  })
})
