'use client'

import type { ReactNode } from 'react'

import {
  type ArtifactDisplay,
  ContentFieldValue,
  FieldSeparator,
  isSeparatorField,
  useWorkflowDefinition,
  type ValueDefinition,
} from '@/modules/workflow/entities/@x/artifact'
import { ColoredText } from '@/shared/components/ui/colored-text'
import type { HighlightRange } from '@/shared/components/ui/highlight'
import { isEmpty } from '@/shared/lib/guards'

import type {
  ArtifactDocumentData,
  RenderItemIdLink,
  RenderItemLink,
} from '../outline/outline.types'
import { useItemStatusLook } from '../status/hooks/useItemStatusLook'
import { artifactViewMessages } from './artifact-view.constants'
import { DocumentBlocks } from './DocumentBlocks'

interface ArtifactDocumentProps<Range extends HighlightRange = HighlightRange> {
  /** The document to draw, from `useArtifactDocument`. */
  data: ArtifactDocumentData
  /** Draws the title of an item as a link; the page knows the addresses, this view does not. */
  renderItemLink: RenderItemLink
  /** Whether the document waits for the review of the user. */
  isUnderReview: boolean
  /** What the page places at the right of the title, such as the Edit button. */
  actions?: ReactNode | undefined
  /** The item that the address of the page names: its block is marked and scrolled to. */
  targetItemId?: string | null | undefined
  /** The quoted words of each message of a transcript, by message id. */
  messageMarks?: ReadonlyMap<string, readonly Range[]> | undefined
  /** Wraps the marked words of a message, for example in the trigger of a popover. */
  renderMessageMark?: ((range: Range, children: ReactNode) => ReactNode) | undefined
  /** What the page draws in place of the fields of the document, such as a version the history shows. */
  fieldsView?: ReactNode | undefined
  /** Wraps the people of an avatar list that reach the page of their item, such as a link. */
  renderItemIdLink?: RenderItemIdLink | undefined
}

/** What each layout of a document draws, whichever parts it reads. */
interface LayoutParts {
  /** The fields as sections, for a document. */
  sections: ReactNode
  /** The fields that are not separators, as a list, for a transcript. */
  fieldList: ReactNode
  /** The separator fields of the artifact, after the last message; null when none is filled. */
  endSeparator: ReactNode
  /** The sections and the items, from `DocumentBlocks`. */
  blocks: ReactNode
  /** The fields of the version that the history shows, in place of the fields. */
  version: ReactNode | undefined
}

/** The fields as sections, each under its title: how a document draws them. */
function FieldSections({
  fields,
  content,
  definition,
}: {
  fields: ArtifactDocumentData['fields']
  content: ArtifactDocumentData['artifact']['content']
  definition: ValueDefinition
}) {
  return (
    <>
      {fields.map((field) => (
        <section key={field.name} className="space-y-1">
          <h2 className="text-lg font-semibold">{field.title}</h2>
          <div className="max-w-prose space-y-2">
            <ContentFieldValue field={field} value={content[field.name]} definition={definition} />
          </div>
        </section>
      ))}
    </>
  )
}

/** The fields that are not separators, as a list between two rules: the title of each above its value. */
function TranscriptFields({
  fields,
  content,
  definition,
  renderItemIdLink,
}: {
  fields: ArtifactDocumentData['fields']
  content: ArtifactDocumentData['artifact']['content']
  definition: ValueDefinition
  renderItemIdLink: RenderItemIdLink | undefined
}) {
  const shown = fields.filter((field) => !isSeparatorField(field) && !isEmpty(content[field.name]))
  if (shown.length === 0) return null
  return (
    <dl className="max-w-prose space-y-2 border-y px-1 py-4">
      {shown.map((field) => (
        <div key={field.name} className="flex flex-col gap-1 sm:flex-row sm:gap-6">
          <dt className="text-sm font-semibold text-muted-foreground sm:w-32">{field.title}</dt>
          <dd className="min-w-0 text-sm">
            <ContentFieldValue
              field={field}
              value={content[field.name]}
              definition={definition}
              renderItemIdLink={renderItemIdLink}
            />
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** A document: the fields, or the version that the history shows, as sections, then the blocks. */
function DocumentLayout({ sections, blocks, version }: LayoutParts) {
  return (
    <>
      {version ?? sections}
      {blocks}
    </>
  )
}

/** A transcript: the fields that are not separators as a list, the conversation, then the end separator. */
function TranscriptLayout({ fieldList, endSeparator, blocks, version }: LayoutParts) {
  return (
    <>
      {version ?? fieldList}
      {blocks}
      {version === undefined && endSeparator}
    </>
  )
}

// A layout without a row fails to compile, as a widget without a view does.
const artifactLayouts = {
  document: DocumentLayout,
  transcript: TranscriptLayout,
} as const satisfies Record<ArtifactDisplay, (parts: LayoutParts) => ReactNode>

/**
 * The body of a document page: its title, its status line, its summary, then the parts of its
 * layout, which the display of its artifact kind names: the fields and the blocks of a document,
 * the conversation of a transcript with its fields at the top and its end separator.
 */
export function ArtifactDocument<Range extends HighlightRange = HighlightRange>({
  data,
  renderItemLink,
  isUnderReview,
  actions,
  targetItemId = null,
  messageMarks,
  renderMessageMark,
  fieldsView,
  renderItemIdLink,
}: ArtifactDocumentProps<Range>) {
  const { artifact, display, fields, participants, blocks, kinds } = data
  const { data: definition } = useWorkflowDefinition()
  // A superseded document never reaches a page, so it reads as a draft.
  const look = useItemStatusLook(
    artifact.review_status === 'superseded' ? 'draft' : artifact.review_status,
    { isUnderReview },
  )

  const parts: LayoutParts = {
    sections: <FieldSections fields={fields} content={artifact.content} definition={definition} />,
    fieldList: (
      <TranscriptFields
        fields={fields}
        content={artifact.content}
        definition={definition}
        renderItemIdLink={renderItemIdLink}
      />
    ),
    endSeparator: (
      <FieldSeparator
        fields={fields.filter(isSeparatorField)}
        content={artifact.content}
        definition={definition}
        className="font-semibold text-primary"
      />
    ),
    blocks: (
      <DocumentBlocks
        blocks={blocks}
        kinds={kinds}
        participants={participants}
        renderItemLink={renderItemLink}
        targetItemId={targetItemId}
        messageMarks={messageMarks}
        renderMessageMark={renderMessageMark}
      />
    ),
    version: fieldsView,
  }
  const Layout = artifactLayouts[display]

  return (
    <article className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start gap-4">
          <h1 className="text-2xl font-semibold">{artifact.title}</h1>
          {actions}
        </div>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <ColoredText color={look.color} className="font-semibold">
            {look.label}
          </ColoredText>
        </p>
        {artifact.summary !== null && <p className="max-w-prose">{artifact.summary}</p>}
      </header>
      <Layout {...parts} />
      {fields.length === 0 && blocks.length === 0 && (
        <p className="text-muted-foreground">{artifactViewMessages.empty}</p>
      )}
    </article>
  )
}
