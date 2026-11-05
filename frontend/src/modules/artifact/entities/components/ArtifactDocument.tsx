'use client'

import { ContentFieldValue, useWorkflowDefinition } from '@/modules/workflow/entities/@x/artifact'
import { ColoredText } from '@/shared/components/ui/colored-text'

import type { ArtifactDocumentData } from '../outline/outline.types'
import { useItemStatusLook } from '../status/hooks/useItemStatusLook'
import { artifactViewMessages } from './artifact-view.constants'
import { DocumentBlocks, type RenderItemLink } from './DocumentBlocks'

interface ArtifactDocumentProps {
  /** The document to draw, from `useArtifactDocument`. */
  data: ArtifactDocumentData
  /** Draws the title of an item as a link; the page knows the addresses, this view does not. */
  renderItemLink: RenderItemLink
  /** Whether the document waits for the review of the user. */
  isUnderReview: boolean
  /** The item that the address of the page names: its block is marked and scrolled to. */
  targetItemId?: string | null | undefined
}

/**
 * The body of a document page: its title, its status line, its summary, each filled field of the
 * artifact under its label, then its sections and items in the order of the outline.
 */
export function ArtifactDocument({
  data,
  renderItemLink,
  isUnderReview,
  targetItemId = null,
}: ArtifactDocumentProps) {
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
      />
      {fields.length === 0 && blocks.length === 0 && (
        <p className="text-muted-foreground">{artifactViewMessages.empty}</p>
      )}
    </article>
  )
}
