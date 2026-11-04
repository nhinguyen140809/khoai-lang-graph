'use client'

import {
  InitialsAvatar,
  InlineFieldValues,
  itemTitle,
  nonStatusTone,
  profileFields,
  type ValueDefinition,
} from '@/modules/workflow/entities/@x/artifact'
import { Card, CardContent, CardDescription, CardHeader } from '@/shared/components/ui/card'
import { isEmpty } from '@/shared/lib/guards'
import { textOf } from '@/shared/lib/text'

import type { OutlineItem } from '../items/items.types'
import type { KindView, RenderItemLink } from '../outline/outline.types'
import { itemAnchorProps } from '../outline/outline.utils'

interface ItemAvatarCardsProps {
  items: readonly OutlineItem[]
  view: KindView
  renderItemLink: RenderItemLink
  definition: ValueDefinition
  targetItemId: string | null
}

/** One field of an avatar card: a text on at most two lines, a list on one line after its title. */
function CardField({ title, value }: { title: string; value: unknown }) {
  if (isEmpty(value)) return null
  if (Array.isArray(value)) {
    return (
      <p className="line-clamp-1">
        <span className="font-semibold text-muted-foreground">{title}:</span>{' '}
        {value.map((entry) => textOf(entry)).join('; ')}
      </p>
    )
  }
  return <p className="line-clamp-2">{textOf(value)}</p>
}

/**
 * One avatar card per item of a kind whose display is `profile`: the avatar, the title as the link
 * to its page, its fields of one line under it, then a text on two lines and a list on one line.
 */
export function ItemAvatarCards({
  items,
  view,
  renderItemLink,
  definition,
  targetItemId,
}: ItemAvatarCardsProps) {
  const fields = profileFields(view.schema)
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, place) => {
        const title = itemTitle(view.schema, item)
        return (
          <Card
            key={item.id}
            size="sm"
            className="data-[target]:bg-accent/50"
            {...itemAnchorProps(item.id, targetItemId)}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <InitialsAvatar name={title} tone={nonStatusTone(place + 1)} size="sm" />
                <h3 className="text-base font-semibold">{renderItemLink(item, title)}</h3>
              </div>
              <CardDescription>
                <InlineFieldValues
                  fields={fields.line}
                  content={item.content}
                  definition={definition}
                />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {fields.card.map((field) => (
                <CardField key={field.name} title={field.title} value={item.content[field.name]} />
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
