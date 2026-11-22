import { describe, expect, it } from 'vitest'

import { fileExtension, fileProblemOf } from '../file-check.utils'

const limits = { extensions: ['txt', 'md'], maxBytes: 100 }

describe('fileExtension', () => {
  it.each([
    ['notes.txt', 'txt'],
    ['Brief.MD', 'md'],
    ['archive.tar.gz', 'gz'],
    ['README', ''],
    ['.gitignore', ''],
  ])('reads the extension of %s as "%s"', (name, extension) => {
    expect(fileExtension(name)).toBe(extension)
  })
})

describe('fileProblemOf', () => {
  it('accepts a file of an accepted format that is not over the limit', () => {
    expect(fileProblemOf({ name: 'notes.md', size: 100 }, limits)).toBeNull()
  })

  it('refuses a format that is not accepted, before its size', () => {
    expect(fileProblemOf({ name: 'scan.pdf', size: 1000 }, limits)).toBe('unsupported_format')
  })

  it('refuses a file over the limit', () => {
    expect(fileProblemOf({ name: 'notes.txt', size: 101 }, limits)).toBe('too_large')
  })
})
