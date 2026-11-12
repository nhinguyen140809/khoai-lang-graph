import { ErrorBoundary } from 'react-error-boundary'

import { RevisionContent } from '@/modules/artifact/entities'
import { EditItemForm } from '@/modules/artifact/features/edit'

import { useItemPageContext } from '../hooks/useItemPageContext'
import { FieldMarkPopover } from './FieldMarkPopover'
import { ItemDetails } from './ItemDetails'

/**
 * What the page shows under the title, in the mode it is in: the form to edit the item, the
 * selected version in the place of the fields, or the fields with the quoted words marked.
 */
export function ItemBody() {
  const { projectId, record, page, links, isEditing, keepTab } = useItemPageContext()

  if (isEditing) {
    if (page.schema === undefined) return null
    return (
      <EditItemForm
        item={record}
        schema={page.schema}
        lockedReason={page.lockedReason}
        onChanged={page.reloadTraces}
        onFirstChange={keepTab}
      />
    )
  }
  if (page.isHistoryOpen && page.schema !== undefined) {
    return (
      <RevisionContent
        target={{ type: 'item', id: record.id }}
        view={page.history}
        fields={page.fields}
      />
    )
  }
  if (page.view === undefined) return null

  return (
    <ItemDetails
      item={record}
      layout={page.view.layout}
      fields={page.view.bodyFields}
      fieldMarks={links.state === 'success' ? links.fieldMarks : undefined}
      renderFieldMark={(range, children) => (
        <ErrorBoundary resetKeys={[record.id]} fallbackRender={() => children}>
          <FieldMarkPopover projectId={projectId} links={links} range={range}>
            {children}
          </FieldMarkPopover>
        </ErrorBoundary>
      )}
    />
  )
}
