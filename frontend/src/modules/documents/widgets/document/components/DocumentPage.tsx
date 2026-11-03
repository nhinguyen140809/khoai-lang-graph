'use client'

import {
  ArtifactDocument,
  type ArtifactDocumentResult,
  useArtifact,
  useArtifactDocument,
} from '@/modules/artifact/entities'
import {
  documentTabIconName,
  useDocumentDisplays,
  useIsDocumentUnderReview,
  useListedDocumentTitle,
  useWritingArtifacts,
} from '@/modules/documents/entities'
import { useEditorTab } from '@/shared/components/frame'
import { ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { routes } from '@/shared/routes'

import { documentPageMessages } from '../document-page.constants'
import { ItemLink } from './ItemLink'

function DocumentBody({
  document,
  projectId,
  isUnderReview,
}: {
  document: ArtifactDocumentResult
  projectId: string
  isUnderReview: boolean
}) {
  const project = routes.project(projectId)
  // A state fills the page and sits in the middle of it; only the document scrolls.
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
        <ScrollArea className="h-full">
          <ArtifactDocument
            data={document}
            isUnderReview={isUnderReview}
            renderItemLink={(item, title) => (
              <ItemLink href={project.item(item.id)}>{title}</ItemLink>
            )}
          />
        </ScrollArea>
      )
  }
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
  useEditorTab(
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

  return <DocumentBody document={document} projectId={projectId} isUnderReview={isUnderReview} />
}
