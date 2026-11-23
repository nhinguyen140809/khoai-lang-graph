import type { FileProblem } from './file.types'

interface FileLimits {
  /** The extensions that are accepted, lowercase and without the dot. */
  extensions: readonly string[]
  /** The largest size that is accepted, in bytes. */
  maxBytes: number
}

/** The extension of a file name, lowercase and without the dot; empty when it has none. */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase()
}

/** What is wrong with a file for the limits, or null when it fits them. */
export function fileProblemOf(
  file: Pick<File, 'name' | 'size'>,
  limits: FileLimits,
): FileProblem | null {
  if (!limits.extensions.includes(fileExtension(file.name))) return 'unsupported_format'
  if (file.size > limits.maxBytes) return 'too_large'
  return null
}
