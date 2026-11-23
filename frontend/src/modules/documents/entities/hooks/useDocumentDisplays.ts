'use client'

import { useMemo } from 'react'

import { documentDisplaysByKind, useArtifactKinds } from '@/modules/workflow/entities/@x/documents'

/** The display of each document kind, which its mark is drawn from. */
export function useDocumentDisplays() {
  const kinds = useArtifactKinds()
  return useMemo(() => documentDisplaysByKind(kinds.data), [kinds.data])
}
