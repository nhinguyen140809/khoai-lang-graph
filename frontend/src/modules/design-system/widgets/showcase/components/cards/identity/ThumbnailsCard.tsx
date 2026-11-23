import { Thumbnail, ThumbnailGrid } from '@/shared/components/thumbnail'

import { documentBlockKinds, itemBlockKinds } from '../../design-system.fixtures'
import { SampleCard, SampleGroup } from '../Sample'

/**
 * The thumbnails that a folder shows in a grid. The color of a folder comes from its title, and the
 * color of an item from its kind. An icon is the one that the schema of the kind names; a kind that
 * names none, such as a diagram for now, gives a plain thumbnail.
 */
export function ThumbnailsCard() {
  return (
    <SampleCard
      title="Thumbnails"
      description="A folder, a page of text and a diagram, each with its title below. The icon sits on the thumbnail and comes from the kind; a thumbnail without one stays plain."
      className="flex flex-col gap-6"
    >
      <SampleGroup label="The three looks, with and without an icon">
        <ThumbnailGrid>
          <Thumbnail look="folder" title="Folder" icon={null} seed="Folder" />
          <Thumbnail look="folder" title="Interviewees" icon="users" seed="Interviewees" />
          <Thumbnail look="text" title="Page" icon={null} seed="page" />
          <Thumbnail look="text" title="Interviewee" icon="user" seed="persona" />
          <Thumbnail look="diagram" title="Diagram" icon={null} seed="diagram" />
          <Thumbnail look="diagram" title="Diagram with icon" icon="diagram" seed="diagram" />
        </ThumbnailGrid>
      </SampleGroup>
      <SampleGroup label="The documents of the workflow: a folder when it holds items, a page when it holds only text">
        <ThumbnailGrid>
          {documentBlockKinds.map(({ kind, title, icon, look }) => (
            <Thumbnail key={kind} look={look} title={title} icon={icon} seed={title} />
          ))}
        </ThumbnailGrid>
      </SampleGroup>
      <SampleGroup label="The items of the workflow, colored by their kind">
        <ThumbnailGrid>
          {itemBlockKinds.map(({ kind, title, icon, look }) => (
            <Thumbnail key={kind} look={look} title={title} icon={icon} seed={kind} />
          ))}
        </ThumbnailGrid>
      </SampleGroup>
    </SampleCard>
  )
}
