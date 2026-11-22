import type { LiveFile } from './live-file.types'

/** What one connection to a source of a file holds: the last file it sent, and who wants to know when it changes. */
interface LiveSource {
  file: LiveFile | null
  listeners: Set<() => void>
  close: () => void
}

const sources = new Map<string, LiveSource>()

/** The magic bytes that every message of the live link starts with. */
const messageMagic = 'RVLK'

/** The bytes of a message before what it carries: the magic, a version, the kind of message, the length and a number. */
const messageHeaderLength = 16

/** The kind of message that carries a file. The link also says hello and says it is ready, in messages of other kinds. */
const fileMessageKind = 5

/**
 * The file in a message of the live link: the bytes after the header of a message that carries one,
 * or none for any other message. The format of the messages is not published, so a message that is
 * not understood is left out, and the page goes on with the file it has.
 */
export function fileOfMessage(message: ArrayBuffer): ArrayBuffer | null {
  const bytes = new Uint8Array(message)
  const magic = new TextDecoder('latin1').decode(bytes.subarray(0, messageMagic.length))
  if (magic !== messageMagic || bytes.length <= messageHeaderLength) return null
  const kind = new DataView(message).getUint16(6, true)
  return kind === fileMessageKind ? message.slice(messageHeaderLength) : null
}

/** Opens a connection that keeps the last file it was sent, and sends the file again whenever the source builds a new one. A source that is not there, or goes away, is tried again after a while. */
function openSource(url: string): LiveSource {
  const source: LiveSource = { file: null, listeners: new Set(), close: () => undefined }
  let socket: WebSocket | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let isClosed = false

  const connect = () => {
    socket = new WebSocket(url)
    socket.binaryType = 'arraybuffer'
    socket.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (!(event.data instanceof ArrayBuffer)) return
      const buffer = fileOfMessage(event.data)
      if (buffer === null) return
      source.file = { buffer, version: (source.file?.version ?? 0) + 1 }
      for (const listener of source.listeners) listener()
    })
    socket.addEventListener('close', () => {
      if (!isClosed) timer = setTimeout(connect, 2000)
    })
  }
  connect()
  source.close = () => {
    isClosed = true
    clearTimeout(timer)
    socket?.close()
  }
  return source
}

/** The source of a file at an address: one connection for every part of the page that asks, opened by the first and closed when the last has left. */
export function subscribeToSource(url: string, listener: () => void): () => void {
  const source = sources.get(url) ?? openSource(url)
  sources.set(url, source)
  source.listeners.add(listener)
  return () => {
    source.listeners.delete(listener)
    if (source.listeners.size === 0) {
      source.close()
      sources.delete(url)
    }
  }
}

/** The last file that the source at an address sent; none before the first. */
export function fileOfSource(url: string): LiveFile | null {
  return sources.get(url)?.file ?? null
}
