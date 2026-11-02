'use client'

import { useMemo } from 'react'

import { documentDisplaysByKind, useArtifactKinds } from '@/modules/workflow/entities/@x/documents'

/**
 * What each kind of document is made of, by kind name, which gives its icon: empty until the kinds
 * load.
 */
export function useDocumentDisplays() {
  const kinds = useArtifactKinds()
  return useMemo(() => documentDisplaysByKind(kinds.data), [kinds.data])
}
