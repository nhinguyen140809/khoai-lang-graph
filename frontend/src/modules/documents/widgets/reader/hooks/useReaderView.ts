'use client'

import { useState } from 'react'

import { RouteParam, useRouteParam } from '@/shared/routes'

import type { ReaderView } from '../reader.types'
import { isSameView, readerViewOf, trailAfter } from '../reader.utils'
import { useOpenReaderView } from './useOpenReaderView'

/**
 * What the reader beside the chat shows, which the query of the page names, and what opens another
 * view in its place or closes it. `shown` stays on the last view after the reader closes, so that a
 * sheet that slides away keeps its content. `canGoBack` holds when the reader has shown another
 * view before the one on show, which Back returns to.
 */
export function useReaderView() {
  const view = readerViewOf({
    documentId: useRouteParam(RouteParam.Document),
    folderId: useRouteParam(RouteParam.Folder),
    groupKind: useRouteParam(RouteParam.Group),
    itemId: useRouteParam(RouteParam.Item),
    reader: useRouteParam(RouteParam.Reader),
  })
  const [shown, setShown] = useState(view)
  if (view !== null && !isSameView(view, shown)) setShown(view)
  const [trail, setTrail] = useState<ReaderView[]>(() => trailAfter([], view))
  const next = trailAfter(trail, view)
  const hasChanged =
    next.length !== trail.length ||
    (next.length > 0 && !isSameView(next.at(-1) ?? null, trail.at(-1) ?? null))
  if (hasChanged) setTrail(next)

  const open = useOpenReaderView()
  return { view, shown, canGoBack: trail.length > 1, ...open }
}
