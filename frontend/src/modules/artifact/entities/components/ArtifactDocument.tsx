'use client'

import type { ReactNode } from 'react'

import { ContentFieldValue, useWorkflowDefinition } from '@/modules/workflow/entities/@x/artifact'
import { ColoredText } from '@/shared/components/ui/colored-text'
import type { HighlightRange } from '@/shared/components/ui/highlight'

import type { ArtifactDocumentData } from '../outline/outline.types'
import { useItemStatusLook } from '../status/hooks/useItemStatusLook'
import { artifactViewMessages } from './artifact-view.constants'
import { DocumentBlocks, type RenderItemLink } from './DocumentBlocks'

interface ArtifactDocumentProps<Range extends HighlightRange = HighlightRange> {
  /** The document to draw, from `useArtifactDocument`. */
  data: ArtifactDocumentData
  /** Draws the title of an item as a link; the page knows the addresses, this view does not. */
  renderItemLink: RenderItemLink
  /** Whether the document waits for the review of the user. */
  isUnderReview: boolean
  /** The item that the address of the page names: its block is marked and scrolled to. */
  targetItemId?: string | null | undefined
  /** The quoted words of each message of a transcript, by message id. */
  messageMarks?: ReadonlyMap<string, readonly Range[]> | undefined
  /** Wraps the marked words of a message, for example in the trigger of a popover. */
  renderMessageMark?: ((range: Range, children: ReactNode) => ReactNode) | undefined
}

/**
 * The body of a document page: its title, its status line, its summary, each filled field of the
 * artifact under its label, then its sections and items in the order of the outline.
 */
export function ArtifactDocument<Range extends HighlightRange = HighlightRange>({
  data,
  renderItemLink,
  isUnderReview,
  targetItemId = null,
  messageMarks,
  renderMessageMark,
}: ArtifactDocumentProps<Range>) {
  const { artifact, fields, blocks, kinds } = data
  const { data: definition } = useWorkflowDefinition()
  // A superseded document never reaches a page, so it reads as a draft.
  const look = useItemStatusLook(
    artifact.review_status === 'superseded' ? 'draft' : artifact.review_status,
    { isUnderReview },
  )

  return (
    <article className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{artifact.title}</h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <ColoredText color={look.color} className="font-semibold">
            {look.label}
          </ColoredText>
          <span className="text-muted-foreground">
            {artifactViewMessages.version(artifact.version)}
          </span>
        </p>
        {artifact.summary !== null && <p className="max-w-prose">{artifact.summary}</p>}
      </header>
      {fields.map((field) => (
        <section key={field.name} className="space-y-1">
          <h2 className="text-lg font-semibold">{field.title}</h2>
          <div className="max-w-prose space-y-2">
            <ContentFieldValue
              field={field}
              value={artifact.content[field.name]}
              definition={definition}
            />
          </div>
        </section>
      ))}
      <DocumentBlocks
        blocks={blocks}
        kinds={kinds}
        renderItemLink={renderItemLink}
        targetItemId={targetItemId}
        messageMarks={messageMarks}
        renderMessageMark={renderMessageMark}
      />
      {fields.length === 0 && blocks.length === 0 && (
        <p className="text-muted-foreground">{artifactViewMessages.empty}</p>
      )}
    </article>
  )
}
