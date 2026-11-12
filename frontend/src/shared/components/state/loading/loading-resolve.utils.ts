import type { LoadingLayout, StateSize } from '../state.types'
import type { LoadingContainerKind } from './loading.types'

/** What the caller asked for, before the defaults. */
interface LoadingRequest {
  layout: LoadingLayout | undefined
  columns: number | undefined
  fill: boolean | undefined
  width: 'full' | 'narrow' | undefined
  alternate: boolean
  size: StateSize
}

/**
 * What the placeholder is, once the defaults are applied: the layout, whether it fills the height
 * of its container, whether it keeps a narrow column, and the container that holds it. A request
 * that names nothing, in the `page` size, is the plain one: `lines` in a narrow column, in the
 * middle of the container, as it always was.
 */
export function resolveLoading({ layout, columns, fill, width, alternate, size }: LoadingRequest): {
  layout: LoadingLayout
  isFilling: boolean
  isNarrow: boolean
  container: LoadingContainerKind
} {
  const isPlain = layout === undefined && columns === undefined && size === 'page' && !alternate
  const isNarrow = (width ?? (isPlain ? 'narrow' : 'full')) === 'narrow'
  const isFilling = fill ?? (layout !== undefined && size === 'page')
  return {
    layout: layout ?? (columns === undefined ? 'lines' : 'table'),
    isFilling,
    isNarrow,
    container: containerOf({ isPlain, isNarrow, isFilling }),
  }
}

function containerOf({
  isPlain,
  isNarrow,
  isFilling,
}: {
  isPlain: boolean
  isNarrow: boolean
  isFilling: boolean
}): LoadingContainerKind {
  if (isPlain && isNarrow) return 'centered'
  if (isFilling) return 'filling'
  return 'flow'
}
