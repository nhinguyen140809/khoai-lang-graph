import { cn } from 'cn'
import type { ComponentProps, ReactNode } from 'react'

import { thumbnailIcons } from './thumbnail.constants'
import { thumbnailStyleOf } from './thumbnail.utils'

/** How a thumbnail is drawn: a folder, a page of text or a diagram. */
export type ThumbnailLook = 'folder' | 'text' | 'diagram'

interface ThumbnailProps extends Omit<ComponentProps<'div'>, 'title'> {
  look: ThumbnailLook
  title: string
  /** The name of the icon on the thumbnail; null for none, and for a name that is not known. */
  icon: string | null
  /** The text that the color of the thumbnail comes from. */
  seed: string
}

/** The papers that rise out of a folder while it is hovered, each a little higher and turned; they show what it holds and nothing more. */
const paperRises = [
  'group-hover/thumbnail:-translate-y-4 group-hover/thumbnail:-rotate-3',
  'group-hover/thumbnail:-translate-y-5',
  'group-hover/thumbnail:-translate-y-3.5 group-hover/thumbnail:rotate-3',
] as const

/** The glow of the thumbnail's color that rises around it while it is hovered. */
function ThumbnailGlow() {
  return (
    <span
      aria-hidden
      className="absolute inset-2 rounded-xl bg-(--thumbnail-color) opacity-0 blur-xl transition-opacity duration-300 group-hover/thumbnail:opacity-70 motion-reduce:transition-none"
    />
  )
}

/** A folder: one flat shape of one color, its title at the top left, its icon at the bottom right, and papers that rise out of it while it is hovered. */
function FolderThumbnail({ look, title, icon, seed, className, style, ...props }: ThumbnailProps) {
  const Icon = icon === null ? undefined : thumbnailIcons[icon]

  return (
    <div
      data-look={look}
      className={cn('group/thumbnail relative aspect-4/3 w-full', className)}
      style={{ ...thumbnailStyleOf(seed), ...style }}
      {...props}
    >
      <ThumbnailGlow />
      {paperRises.map((rise) => (
        <span
          key={rise}
          aria-hidden
          className={cn(
            'absolute inset-x-3 top-4 bottom-1/3 rounded-md border bg-(--thumbnail-paper) shadow-xs transition-transform duration-300 ease-out motion-reduce:transition-none',
            rise,
          )}
        />
      ))}
      <span
        aria-hidden
        className="absolute top-0 left-0 h-6 w-2/5 rounded-t-lg bg-(--thumbnail-color)"
      />
      <div className="absolute inset-x-0 top-4 bottom-0 flex flex-col justify-between rounded-xl rounded-tl-none bg-(--thumbnail-color) p-2.5 text-secondary-foreground">
        <span className="line-clamp-3 text-left text-3xs leading-tight font-semibold">{title}</span>
        {Icon === undefined ? <span /> : <Icon aria-hidden className="size-5 self-end" />}
      </div>
    </div>
  )
}

/**
 * A page of text or a diagram: its icon in a frame, with its title below. The frame is a solid
 * border for a page and a dashed one in the color of the thumbnail for a diagram, both read from the
 * `data-look` of the thumbnail.
 */
function PageThumbnail({ look, title, icon, seed, className, style, ...props }: ThumbnailProps) {
  const Icon = icon === null ? undefined : thumbnailIcons[icon]

  return (
    <div
      data-look={look}
      className={cn('group/thumbnail flex flex-col gap-2', className)}
      style={{ ...thumbnailStyleOf(seed), ...style }}
      {...props}
    >
      <div className="relative aspect-4/3 w-full">
        <ThumbnailGlow />
        <div className="absolute inset-0 flex items-center justify-center rounded-md border border-border bg-(--thumbnail-paper) text-(--thumbnail-color) group-data-[look=diagram]/thumbnail:border-dashed group-data-[look=diagram]/thumbnail:border-(--thumbnail-color)">
          {Icon === undefined ? null : <Icon aria-hidden className="size-1/4" />}
        </div>
      </div>
      <span className="truncate text-center text-sm">{title}</span>
    </div>
  )
}

/** How each look is drawn: the thumbnail picks its view by its look, so that a new look is a new entry here. */
const thumbnailViews = {
  folder: FolderThumbnail,
  text: PageThumbnail,
  diagram: PageThumbnail,
} as const satisfies Record<ThumbnailLook, (props: ThumbnailProps) => ReactNode>

/**
 * One thumbnail of a grid: a drawing of a folder, of a page of text or of a diagram, with the icon of
 * its kind on it. A folder is one flat shape of one color: its title at the top left, its icon at
 * the bottom right, and some papers that rise out of it while it is hovered. A page and a diagram
 * carry their title below. The color is one of the palette, by its seed, and a glow of that color
 * rises around the thumbnail while it is hovered. The thumbnail opens nothing itself; a link or a button
 * wraps it.
 */
export function Thumbnail(props: ThumbnailProps) {
  const View = thumbnailViews[props.look]
  return <View {...props} />
}
