'use client'

import { useState } from 'react'

import { RouteParam, useRouteParam } from '@/shared/routes'

import { isSameView, readerViewOf } from '../reader.utils'
import { useOpenReaderView } from './useOpenReaderView'

/**
 * What the reader beside the chat shows, which the query of the page names, and what opens another
 * view in its place or closes it. `shown` stays on the last view after the reader closes, so that a
 * sheet that slides away keeps its content.
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
  const open = useOpenReaderView()
  return { view, shown, ...open }
}
