'use client'

import { useEffect } from 'react'

import type { ContentField } from '@/modules/workflow/entities/@x/artifact'
import {
  contentChanges,
  ContentFieldValue,
  useWorkflowDefinition,
} from '@/modules/workflow/entities/@x/artifact'
import { Badge } from '@/shared/components/ui/badge'
import { DiffView } from '@/shared/components/ui/diff-view'
import { isEmpty } from '@/shared/lib/guards'
import { jsonToPlainText } from '@/shared/lib/text'

import { useRevisionHistory } from '../../revisions/hooks/useRevisionQueries'
import { revisionMessages } from '../../revisions/revisions.constants'
import type { HistoryView, RevisionTarget } from '../../revisions/revisions.types'
import { previousRevision } from '../../revisions/revisions.utils'

interface RevisionContentProps {
  target: RevisionTarget
  view: HistoryView
  /** The fields of the schema of the record, in their order. */
  fields: readonly ContentField[]
}

/**
 * The content of the selected version of a record, drawn in place of the fields while the
 * history surface is open (decision 11): each field that has a value at the version, and, when
 * the changes are asked for, the words that differ from the version right before. Nothing while
 * the surface is closed; the surface itself carries the way back to the current version.
 */
export function RevisionContent({ target, view, fields }: RevisionContentProps) {
  const { data: definition } = useWorkflowDefinition()
  // The same query as the surface reads, so the versions load once for both.
  const history = useRevisionHistory(target, { isEnabled: view.level !== 'closed' })

  // The page before the selected version loads on its own, so the changes can show as soon as it
  // is there.
  useEffect(() => {
    if (history.state !== 'success') return
    const revision = history.revisions.find(({ version }) => version === view.selectedVersion)
    if (revision === undefined) return
    if (previousRevision(history.revisions, revision.version) === undefined && history.hasMore) {
      history.loadMore().catch(() => undefined)
    }
  }, [history, view.selectedVersion])

  if (view.level === 'closed' || history.state !== 'success') return null
  const revision = history.revisions.find(({ version }) => version === view.selectedVersion)
  if (revision === undefined) return null
  // The version right before, for the changes; the next page loads while it is missing, and the
  // fields read as they are until it arrives.
  const before = previousRevision(history.revisions, revision.version)
  const changes =
    before === undefined ? [] : contentChanges(fields, before.content, revision.content)
  const changedByName = new Map(
    changes.map(({ field, before: was, after: is }) => [field.name, { was, is }]),
  )

  return (
    <div className="space-y-6">
      {fields
        .filter((field) => !isEmpty(revision.content[field.name]))
        .map((field) => {
          const change = changedByName.get(field.name)
          const isDiffShown = view.showsChanges && change !== undefined
          return (
            <section key={field.name} className="space-y-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                {field.title}
                {isDiffShown && <Badge variant="soft">{revisionMessages.changed}</Badge>}
              </h2>
              <div className="max-w-prose space-y-2">
                {isDiffShown ? (
                  <DiffView
                    before={jsonToPlainText(change.was)}
                    after={jsonToPlainText(change.is)}
                  />
                ) : (
                  <ContentFieldValue
                    field={field}
                    value={revision.content[field.name]}
                    definition={definition}
                  />
                )}
              </div>
            </section>
          )
        })}
      {view.showsChanges && before !== undefined && changes.length === 0 && (
        <p className="text-muted-foreground">{revisionMessages.noChange}</p>
      )}
    </div>
  )
}
