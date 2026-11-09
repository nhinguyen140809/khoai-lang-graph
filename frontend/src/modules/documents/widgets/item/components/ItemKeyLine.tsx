'use client'

import {
  type ArtifactItem,
  type ItemStatus,
  revisionMessages,
  useItemStatusLook,
} from '@/modules/artifact/entities'
import {
  type ContentField,
  InlineFieldValues,
  useWorkflowDefinition,
} from '@/modules/workflow/entities'
import { ColoredText } from '@/shared/components/ui/colored-text'
import { KeyText } from '@/shared/components/ui/key-text'
import { lowerFirst } from '@/shared/lib/text'

interface ItemKeyLineProps {
  item: ArtifactItem
  status: ItemStatus
  /** Whether the document of the item waits for the review of the user. */
  isUnderReview: boolean
  /** The fields that follow the key, as the page layout of the item names them; none while its schema loads. */
  fields?: readonly ContentField[] | undefined
}

const noFields: ContentField[] = []

/**
 * The key line of an item: the fields of one line that its page layout names, above its kind, the
 * label of its status in its color and its version, with the key of the item last, small and
 * muted. The page draws the line right under the title, with the links of the item under it.
 */
export function ItemKeyLine({ item, status, isUnderReview, fields = noFields }: ItemKeyLineProps) {
  const { data: definition } = useWorkflowDefinition()
  const look = useItemStatusLook(status, { isUnderReview })

  return (
    <div className="space-y-0.5 text-sm">
      {fields.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <InlineFieldValues fields={fields} content={item.content} definition={definition} />
        </p>
      )}
      <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <ColoredText color={look.color} className="font-semibold">
          {look.label}
        </ColoredText>
        <span className="text-xs text-muted-foreground">
          {lowerFirst(revisionMessages.version(item.version))}
        </span>
        <KeyText>{item.key}</KeyText>
      </p>
    </div>
  )
}
