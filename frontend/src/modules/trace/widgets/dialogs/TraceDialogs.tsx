'use client'

import { useItem } from '@/modules/artifact/entities'
import { AddLinkDialog, useAddLinkDialog } from '@/modules/trace/features/add-link'
import { RemoveLinkDialog, useRemoveLinkDialog } from '@/modules/trace/features/remove-link'

/**
 * The dialogs that change the links of the items of a project, Add link and Remove link, which
 * the menus of the pages open. Each layout mounts it once, so that the screen has one of each,
 * whatever opens it.
 */
export function TraceDialogs({ projectId }: { projectId: string }) {
  const addLink = useAddLinkDialog()
  const removeLink = useRemoveLinkDialog()
  const source = useItem(addLink.targetId ?? '', undefined, {
    isEnabled: addLink.targetId !== null,
  })

  return (
    <>
      {source.data !== undefined && (
        <AddLinkDialog
          key={source.data.id}
          projectId={projectId}
          source={source.data}
          open={addLink.open}
          onOpenChange={addLink.setOpen}
          onClosed={addLink.closed}
        />
      )}
      {removeLink.targetId !== null && (
        <RemoveLinkDialog
          key={removeLink.targetId}
          linkKey={removeLink.targetId}
          open={removeLink.open}
          onOpenChange={removeLink.setOpen}
          onClosed={removeLink.closed}
        />
      )}
    </>
  )
}
