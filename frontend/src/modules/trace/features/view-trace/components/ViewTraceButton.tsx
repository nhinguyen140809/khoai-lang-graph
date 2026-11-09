'use client'

import { ActionIconButton } from '@/shared/components/ui/menu-action'

import { useViewTraceAction } from '../hooks/useViewTraceAction'

interface ViewTraceButtonProps {
  projectId: string
  /** The item whose trace the button shows. */
  itemId: string
  /** The title of that item, for the tab that opens; none when the tab is named by the page. */
  title?: string | undefined
}

/**
 * An icon button that shows the trace of an item in the preview tab. It says what it does in a
 * tooltip and in its name for assistive technology.
 */
export function ViewTraceButton({ projectId, itemId, title }: ViewTraceButtonProps) {
  const viewTrace = useViewTraceAction(projectId)({ id: itemId, title })

  return <ActionIconButton action={viewTrace} />
}
