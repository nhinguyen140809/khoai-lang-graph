import { useFollowedExportsStore } from '../stores/followed-exports.store'

/** Follows an export until its file is ready or failed. */
export function useFollowExport() {
  return useFollowedExportsStore((state) => state.follow)
}

/** The exports that the page follows. */
export function useFollowedExports() {
  return useFollowedExportsStore((state) => state.exportIds)
}

/** Stops following an export, once its outcome is shown. */
export function useForgetExport() {
  return useFollowedExportsStore((state) => state.forget)
}
