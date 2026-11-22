/** A file that a source sent, and how many files it has sent so far (the first is 1), so that whoever shows it can tell a new file from the one before. */
export interface LiveFile {
  buffer: ArrayBuffer
  version: number
}
