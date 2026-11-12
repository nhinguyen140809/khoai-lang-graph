import type { LoadingLayout } from '../../state.types'
import type { LoadingContainerKind } from '../loading.types'
import type { resolveLoading } from '../loading-resolve.utils'

type Request = Parameters<typeof resolveLoading>[0]

const base: Request = {
  layout: undefined,
  columns: undefined,
  fill: undefined,
  width: undefined,
  alternate: false,
  size: 'page',
}

/** What the caller asks for, and what the placeholder is once the defaults are applied. */
export const resolveCases: {
  name: string
  request: Request
  layout: LoadingLayout
  container: LoadingContainerKind
  isNarrow: boolean
  isFilling: boolean
}[] = [
  {
    name: 'nothing named in the page size: lines in a narrow column, in the middle',
    request: base,
    layout: 'lines',
    container: 'centered',
    isNarrow: true,
    isFilling: false,
  },
  {
    name: 'columns without a layout: a table in the flow of the page',
    request: { ...base, columns: 3 },
    layout: 'table',
    container: 'flow',
    isNarrow: false,
    isFilling: false,
  },
  {
    name: 'a layout in the page size: it fills its container, at the full width',
    request: { ...base, layout: 'cards' },
    layout: 'cards',
    container: 'filling',
    isNarrow: false,
    isFilling: true,
  },
  {
    name: 'a layout that does not fill, in the flow of the page',
    request: { ...base, layout: 'list', fill: false },
    layout: 'list',
    container: 'flow',
    isNarrow: false,
    isFilling: false,
  },
  {
    name: 'lines that alternate are no longer the plain ones',
    request: { ...base, alternate: true },
    layout: 'lines',
    container: 'flow',
    isNarrow: false,
    isFilling: false,
  },
  {
    name: 'the compact size: nothing named stays in the flow',
    request: { ...base, size: 'compact' },
    layout: 'lines',
    container: 'flow',
    isNarrow: false,
    isFilling: false,
  },
]
