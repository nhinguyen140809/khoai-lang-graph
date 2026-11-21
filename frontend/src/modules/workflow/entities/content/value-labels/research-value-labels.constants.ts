import type { Wording } from '@/shared/lib/view'

/** Where a source document of the research came from, in each view. */
export const sourceOriginLabels = {
  web: { developer: 'Found on the web' },
  upload: { developer: 'Uploaded by a member' },
} as const satisfies Record<string, Wording>
