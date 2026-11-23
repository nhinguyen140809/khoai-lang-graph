'use client'

import { useAttachedFilesStore } from '@/shared/lib/files'

import { newProjectSourcesScope } from '../sources.constants'

const noFiles: readonly File[] = []

/**
 * The files chosen as sources before their project exists, and how to change the choice. They are
 * kept in a store, so that the prompt that chooses them, the list that shows them and the form that
 * uploads them once the project is created share them without anything between them being told.
 */
export function useAttachedSources() {
  const files = useAttachedFilesStore(
    (state) => state.filesByScope[newProjectSourcesScope] ?? noFiles,
  )
  const addFiles = useAttachedFilesStore((state) => state.addFiles)
  const removeFile = useAttachedFilesStore((state) => state.removeFile)

  return {
    files,
    add: (added: readonly File[]) => {
      addFiles(newProjectSourcesScope, added)
    },
    remove: (file: File) => {
      removeFile(newProjectSourcesScope, file)
    },
  }
}
