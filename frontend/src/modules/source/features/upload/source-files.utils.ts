import { sourceFormats, sourceMaxBytes } from '@/modules/source/entities'
import { type FileProblem, fileProblemOf } from '@/shared/lib/files'

import { uploadSourceMessages } from './upload.constants'

interface RefusedFile {
  file: File
  problem: FileProblem
}

/** The files that a source can be, and the others with what is wrong with each. */
export function splitSourceFiles(files: readonly File[]): {
  accepted: File[]
  refused: RefusedFile[]
} {
  const accepted: File[] = []
  const refused: RefusedFile[] = []
  for (const file of files) {
    const problem = fileProblemOf(file, { extensions: sourceFormats, maxBytes: sourceMaxBytes })
    if (problem === null) accepted.push(file)
    else refused.push({ file, problem })
  }
  return { accepted, refused }
}

/** What to tell the user of a file that cannot be a source, in words. */
export function refusalMessageOf(file: Pick<File, 'name'>, problem: FileProblem): string {
  return problem === 'too_large'
    ? uploadSourceMessages.tooLarge(file.name, `${String(sourceMaxBytes / 1024 / 1024)} MB`)
    : uploadSourceMessages.unsupportedFormat(file.name, sourceFormats.join(', '))
}
