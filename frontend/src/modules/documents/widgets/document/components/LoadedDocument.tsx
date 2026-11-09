'use client'

import { useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { toast } from 'sonner'

import {
  ArtifactDocument,
  type ArtifactDocumentResult,
  hasTranscript,
  HistorySurface,
  itemAnchorId,
  RevisionContent,
  useHistoryView,
  useItemSchema,
} from '@/modules/artifact/entities'
import { EditArtifactForm, EditRecordButton, useIsEditing } from '@/modules/artifact/features/edit'
import { RestoreVersionMenuItem } from '@/modules/artifact/features/restore'
import { useEditLockReason } from '@/modules/documents/entities'
import { markRangesOf, useLinkQuotesOf, useReloadTraces } from '@/modules/trace/entities'
import { extensionFieldText } from '@/modules/workflow/entities'
import { errorMessageOf } from '@/shared/api/error'
import { PageLink } from '@/shared/components/frame'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { useScrollIntoViewById } from '@/shared/lib/viewport'
import { RouteParam, routes, useRouteParam } from '@/shared/routes'

import { MessageMarkPopover } from './MessageMarkPopover'

export function LoadedDocument({
  document,
  projectId,
  isUnderReview,
  keepTab,
}: {
  document: Extract<ArtifactDocumentResult, { state: 'success' }>
  projectId: string
  isUnderReview: boolean
  keepTab: () => void
}) {
  const project = routes.project(projectId)
  const target = { type: 'artifact' as const, id: document.artifact.id }
  const isEditing = useIsEditing(target)
  const lockedReason = useEditLockReason(projectId, document.artifact.id)
  const history = useHistoryView(document.artifact.version, { isHidden: isEditing })
  const reloadTraces = useReloadTraces()
  const targetItemId = useRouteParam(RouteParam.Item)
  // The quoted words of the messages of a transcript: read while the document holds one.
  const hasMessages = hasTranscript(document.blocks)
  const quotes = useLinkQuotesOf(document.artifact.id, {
    isEnabled: hasMessages && !isEditing,
  })
  // The marks are the only thing the quotes give, so a failed load only says so, and the
  // transcript reads without them.
  const quotesError = quotes.state === 'error' ? quotes.error : null
  useEffect(() => {
    if (quotesError !== null) {
      toast.error(errorMessageOf(quotesError, {}))
    }
  }, [quotesError])
  const { schema: artifactSchema } = useItemSchema(document.artifact)
  useScrollIntoViewById(targetItemId === null ? null : itemAnchorId(targetItemId), {
    block: 'center',
    focus: true,
  })

  // The fields of the document are what the data gives; the content fields of the schema for the history.
  const fields = document.fields
  const messageMarks = new Map<string, ReturnType<typeof markRangesOf>>(
    document.blocks.flatMap((block) =>
      block.type === 'items'
        ? block.items.flatMap((item) => {
            const quotesOfItem =
              quotes.state === 'success' ? quotes.quotesByItem.get(item.id) : undefined
            if (quotesOfItem === undefined) return []
            const marks = markRangesOf(
              extensionFieldText(document.kinds.get(block.kind)?.schema, item, 'x-ui-title-field'),
              quotesOfItem,
            )
            return marks.length === 0 ? [] : ([[item.id, marks] as const] as const)
          })
        : [],
    ),
  )

  return (
    <div className="relative h-full">
      <ScrollArea className="h-full">
        {isEditing ? (
          <div className="mx-auto max-w-3xl space-y-6 p-6">
            <h1 className="text-2xl font-semibold">{document.artifact.title}</h1>
            {artifactSchema !== undefined && (
              <EditArtifactForm
                artifact={document.artifact}
                schema={artifactSchema}
                lockedReason={lockedReason}
                onChanged={reloadTraces}
                onFirstChange={keepTab}
              />
            )}
          </div>
        ) : (
          <ArtifactDocument
            data={document}
            isUnderReview={isUnderReview}
            targetItemId={targetItemId}
            messageMarks={messageMarks}
            renderMessageMark={(range, children) => (
              <ErrorBoundary fallbackRender={() => children} resetKeys={[document.artifact.id]}>
                <MessageMarkPopover projectId={projectId} quotes={quotes} range={range}>
                  {children}
                </MessageMarkPopover>
              </ErrorBoundary>
            )}
            fieldsView={
              history.level !== 'closed' ? (
                <RevisionContent target={target} view={history} fields={fields} />
              ) : undefined
            }
            actions={<EditRecordButton target={target} lockedReason={lockedReason} />}
            renderItemLink={(item, title) => (
              <PageLink href={project.item(item.id)}>{title}</PageLink>
            )}
            renderItemIdLink={(itemId, children) => (
              <PageLink href={project.item(itemId)} className="hover:no-underline">
                {children}
              </PageLink>
            )}
          />
        )}
      </ScrollArea>
      {!isEditing && (
        <HistorySurface
          target={target}
          currentVersion={document.artifact.version}
          view={history}
          renderRestore={(version) => (
            <RestoreVersionMenuItem target={target} version={version} lockedReason={lockedReason} />
          )}
        />
      )}
    </div>
  )
}
