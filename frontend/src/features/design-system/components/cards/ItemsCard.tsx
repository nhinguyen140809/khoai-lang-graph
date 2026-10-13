import { FolderOpenIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/shared/ui/item'

import { personas } from '../../design-system.fixtures'
import { SampleCard } from '../Sample'

export function ItemsCard() {
  return (
    <SampleCard
      title="Personas"
      description="Item, avatar, alert, empty state."
      className="flex flex-col gap-4"
    >
      <ItemGroup className="gap-2">
        {personas.map((persona) => (
          <Item key={persona.key} variant="outline" size="sm">
            <ItemMedia>
              <Avatar>
                <AvatarFallback>{persona.initials}</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                {persona.key} {persona.name}
              </ItemTitle>
              <ItemDescription>{persona.summary}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="ghost" size="sm">
                Open
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AvatarGroup>
          {personas.map((persona) => (
            <Avatar key={persona.key} size="sm">
              <AvatarFallback>{persona.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount>+2</AvatarGroupCount>
        </AvatarGroup>
        interviewed in run 3
      </div>
      <Alert variant="soft" color="primary">
        <InfoIcon />
        <AlertTitle>Waiting for your review</AlertTitle>
        <AlertDescription>The run paused at checkpoint_analysis.</AlertDescription>
      </Alert>
      <Alert variant="soft" color="destructive">
        <TriangleAlertIcon />
        <AlertTitle>Run 2 failed</AlertTitle>
        <AlertDescription>The cost reached the limit of $2.00.</AlertDescription>
      </Alert>
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpenIcon />
          </EmptyMedia>
          <EmptyTitle>No product backlog yet</EmptyTitle>
          <EmptyDescription>
            The backlog manager writes it after the specification review.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" variant="outline">
            Open the specification
          </Button>
        </EmptyContent>
      </Empty>
    </SampleCard>
  )
}
