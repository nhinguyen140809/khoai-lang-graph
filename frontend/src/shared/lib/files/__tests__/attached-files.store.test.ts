import { describe, expect, it } from 'vitest'

import { useAttachedFilesStore } from '../attached-files.store'

const notes = new File(['x'], 'notes.md')
const brief = new File(['y'], 'brief.txt')
const filesOf = (scope: string) => useAttachedFilesStore.getState().filesByScope[scope]

describe('the store of the attached files', () => {
  it('adds files to a scope, in the order they come, and keeps the other scopes apart', () => {
    const { addFiles } = useAttachedFilesStore.getState()

    addFiles('a', [notes])
    addFiles('a', [brief])
    addFiles('b', [notes])

    expect(filesOf('a')).toEqual([notes, brief])
    expect(filesOf('b')).toEqual([notes])
  })

  it('takes one file off, and the scope leaves when its last file does', () => {
    const { addFiles, removeFile } = useAttachedFilesStore.getState()
    addFiles('a', [notes, brief])

    removeFile('a', notes)
    expect(filesOf('a')).toEqual([brief])
    removeFile('a', brief)

    expect(filesOf('a')).toBeUndefined()
  })

  it('keeps the files it is given and no others, and none empties the scope', () => {
    const { addFiles, replaceFiles } = useAttachedFilesStore.getState()
    addFiles('a', [notes, brief])

    replaceFiles('a', [brief])
    expect(filesOf('a')).toEqual([brief])
    replaceFiles('a', [])

    expect(filesOf('a')).toBeUndefined()
  })
})
