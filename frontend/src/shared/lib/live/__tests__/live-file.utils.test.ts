import { describe, expect, it } from 'vitest'

import { fileOfMessage } from '../live-file.utils'

/** A message as the live link sends it: the magic, a version, the kind, the length and a number, then the body. */
function messageOf(kind: number, body: readonly number[]): ArrayBuffer {
  const bytes = new Uint8Array(16 + body.length)
  bytes.set([0x52, 0x56, 0x4c, 0x4b], 0)
  const view = new DataView(bytes.buffer)
  view.setUint16(4, 1, true)
  view.setUint16(6, kind, true)
  view.setUint32(8, body.length, true)
  bytes.set(body, 16)
  return bytes.buffer
}

describe('fileOfMessage', () => {
  it('is the body of a message that carries a file', () => {
    const file = fileOfMessage(messageOf(5, [0x52, 0x49, 0x56, 0x45, 7]))

    expect(file && [...new Uint8Array(file)]).toEqual([0x52, 0x49, 0x56, 0x45, 7])
  })

  it('is none for a message of another kind, such as the hello', () => {
    expect(fileOfMessage(messageOf(4, [1, 2, 3]))).toBeNull()
  })

  it('is none for a message that carries nothing, or that is not from the link', () => {
    expect(fileOfMessage(messageOf(5, []))).toBeNull()
    expect(fileOfMessage(new Uint8Array(40).buffer)).toBeNull()
  })
})
