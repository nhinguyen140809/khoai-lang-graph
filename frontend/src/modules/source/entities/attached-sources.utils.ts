import { useAttachedFilesStore } from '@/shared/lib/files'

import { newProjectSourcesScope } from './sources.constants'

/** The files chosen as sources of a project that does not exist yet, as they are now; for what runs outside a render. */
export function attachedSources(): readonly File[] {
  return useAttachedFilesStore.getState().filesByScope[newProjectSourcesScope] ?? []
}

/** Keeps these files chosen as sources and no others, such as the ones that did not go up. */
export function keepAttachedSources(kept: readonly File[]): void {
  useAttachedFilesStore.getState().replaceFiles(newProjectSourcesScope, kept)
}
