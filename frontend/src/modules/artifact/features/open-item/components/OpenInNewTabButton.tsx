'use client'

import { ActionIconButton } from '@/shared/components/ui/menu-action'

import { useOpenItemActions } from '../hooks/useOpenItemActions'

interface OpenInNewTabButtonProps {
  projectId: string
  /** The item whose page the button opens. */
  itemId: string
  /** The title of that item, for the tab that opens. */
  title: string
}

/**
 * An icon button that opens the page of an item in a tab of its own, which stays, so the list that
 * holds the card of the item stays open beside it. It says what it does in a tooltip and in its
 * name for assistive technology.
 */
export function OpenInNewTabButton({ projectId, itemId, title }: OpenInNewTabButtonProps) {
  const { openInNewTab } = useOpenItemActions(projectId)({ id: itemId, title })

  return <ActionIconButton action={openInNewTab} />
}
