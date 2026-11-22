import { create } from 'zustand'

interface AttachedFilesState {
  /** The files chosen to be attached somewhere, by the scope that says where, such as a prompt. */
  filesByScope: Readonly<Record<string, readonly File[]>>
  addFiles: (scope: string, added: readonly File[]) => void
  removeFile: (scope: string, file: File) => void
  /** Keeps these files in the scope and no others; none empties it. */
  replaceFiles: (scope: string, kept: readonly File[]) => void
}

/** The files that have been chosen to be attached and not yet sent; not stored, since a file cannot be. */
export const useAttachedFilesStore = create<AttachedFilesState>()((set) => {
  const replaced = (
    filesByScope: AttachedFilesState['filesByScope'],
    scope: string,
    kept: readonly File[],
  ) =>
    kept.length === 0
      ? Object.fromEntries(Object.entries(filesByScope).filter(([other]) => other !== scope))
      : { ...filesByScope, [scope]: kept }

  return {
    filesByScope: {},
    addFiles: (scope, added) => {
      set((state) => ({
        filesByScope: replaced(state.filesByScope, scope, [
          ...(state.filesByScope[scope] ?? []),
          ...added,
        ]),
      }))
    },
    removeFile: (scope, file) => {
      set((state) => ({
        filesByScope: replaced(
          state.filesByScope,
          scope,
          (state.filesByScope[scope] ?? []).filter((other) => other !== file),
        ),
      }))
    },
    replaceFiles: (scope, kept) => {
      set((state) => ({ filesByScope: replaced(state.filesByScope, scope, kept) }))
    },
  }
})
