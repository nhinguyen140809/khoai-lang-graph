'use client'

import { type ReactNode, useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { toast } from 'sonner'

import {
  ArtifactDocument,
  type ArtifactDocumentResult,
  hasTranscript,
  HistorySurface,
  RevisionContent,
  useArtifact,
  useArtifactDocument,
  useHistoryView,
  useItemSchema,
} from '@/modules/artifact/entities'
import { EditArtifactForm, EditRecordButton, useIsEditing } from '@/modules/artifact/features/edit'
import { RestoreVersionMenuItem } from '@/modules/artifact/features/restore'
import {
  documentTabIconName,
  useDocumentDisplays,
  useEditLockReason,
  useIsDocumentUnderReview,
  useListedDocumentTitle,
  useWritingArtifacts,
} from '@/modules/documents/entities'
import {
  markRangesOf,
  QuotedWordsPopover,
  quoteMarkColors,
  useLinkQuotesOf,
  useReloadTraces,
} from '@/modules/trace/entities'
import { extensionFieldText } from '@/modules/workflow/entities'
import { errorMessageOf } from '@/shared/api/error'
import { PageLink, useEditorTab } from '@/shared/components/frame'
import { ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { routes } from '@/shared/routes'

import { documentPageMessages } from '../document-page.constants'
import { useDocumentTarget } from '../hooks/useDocumentTarget'
import { useScrollToItem } from '../hooks/useScrollToItem'

/** A state fills the page and sits in the middle of it; only the document scrolls. */
function DocumentBody({
  document,
  projectId,
  isUnderReview,
  keepTab,
}: {
  document: ArtifactDocumentResult
  projectId: string
  isUnderReview: boolean
  /** Keeps the tab of the page; the first change of the form calls it. */
  keepTab: () => void
}) {
  switch (document.state) {
    case 'pending':
      return <LoadingState label={documentPageMessages.loading} />
    case 'notFound':
      return (
        <NotFoundState
          title={documentPageMessages.notFound.title}
          description={documentPageMessages.notFound.description}
        />
      )
    case 'error':
      return <ErrorState message={documentPageMessages.loadError} onRetry={document.retry} />
    case 'success':
      return (
        <LoadedDocument
          document={document}
          projectId={projectId}
          isUnderReview={isUnderReview}
          keepTab={keepTab}
        />
      )
  }
}

function LoadedDocument({
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
  const targetItemId = useDocumentTarget()
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
  useScrollToItem(targetItemId, { isReady: true })

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

/** A mark of the words of a message, wrapped in the card of the items that quote them. */
function MessageMarkPopover({
  projectId,
  quotes,
  range,
  children,
}: {
  projectId: string
  quotes: ReturnType<typeof useLinkQuotesOf>
  range: { id: string; linkIds: string[] }
  children: ReactNode
}) {
  if (quotes.state !== 'success') return children
  const quotesOfMark = range.linkIds.flatMap((id) => {
    const quote = quotes.quotesByLinkId.get(id)
    return quote === undefined ? [] : [quote]
  })
  if (quotesOfMark.length === 0) return children
  return (
    <QuotedWordsPopover
      projectId={projectId}
      entries={quotesOfMark.map((quote) => ({
        item: quote.other,
        relation: { direction: 'quotes' },
        isOutOfDate: false,
        otherQuote: quote.link.source_quote,
        quoteColor: quoteMarkColors.source,
        madeFromVersion: null,
      }))}
    >
      {children}
    </QuotedWordsPopover>
  )
}

/**
 * The page of one document, in a tab of its own: the tab is titled with the document and shows
 * the sign of a review while the document waits for the review of the user.
 */
export function DocumentPage({ projectId, artifactId }: { projectId: string; artifactId: string }) {
  const project = routes.project(projectId)
  const artifact = useArtifact(artifactId)
  const document = useArtifactDocument(artifactId)
  const isUnderReview = useIsDocumentUnderReview(projectId, artifactId)
  const listed = useListedDocumentTitle(projectId, artifactId)
  const displays = useDocumentDisplays()
  // The page loads again as the agents write, whether or not the side panel is shown.
  useWritingArtifacts(projectId)

  // The page has a tab of its own while it loads or fails. It waits for the list of the documents to
  // name it, so that a tab is never opened with a stand-in title that the list was about to replace.
  const ownTitle = artifact.data?.title
  const isNamePending = ownTitle === undefined && listed.isPending
  const keepTab = useEditorTab(
    isNamePending
      ? null
      : {
          id: `document:${artifactId}`,
          title: ownTitle ?? listed.title ?? documentPageMessages.tabTitle,
          href: project.document(artifactId),
          icon: documentTabIconName(
            artifact.data === undefined ? undefined : displays.get(artifact.data.kind),
            { isUnderReview },
          ),
        },
    { isTitleProvisional: ownTitle === undefined },
  )

  return (
    <DocumentBody
      document={document}
      projectId={projectId}
      isUnderReview={isUnderReview}
      keepTab={keepTab}
    />
  )
}
