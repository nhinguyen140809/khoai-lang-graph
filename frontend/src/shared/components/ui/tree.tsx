'use client'

// From the Origin UI registry (coss.com/origin/r/tree.json), with the `any` types replaced by the
// headless-tree instance types, the console warnings removed, and labels on the background of
// their container.
import type { ItemInstance, TreeInstance } from '@headless-tree/core'
import { cn } from 'cn'
import { ChevronDownIcon } from 'lucide-react'
import { Slot } from 'radix-ui'
import * as React from 'react'

interface TreeContextValue<T = unknown> {
  indent: number
  guides?: boolean | undefined
  currentItem?: ItemInstance<T> | undefined
  tree?: TreeInstance<T> | undefined
}

const TreeContext = React.createContext<TreeContextValue>({
  currentItem: undefined,
  indent: 20,
  tree: undefined,
})

function useTreeContext<T = unknown>() {
  return React.useContext(TreeContext) as TreeContextValue<T>
}

interface TreeProps<T = unknown> extends React.HTMLAttributes<HTMLDivElement> {
  indent?: number
  tree?: TreeInstance<T>
  /** Draws a vertical line at each level of indent, so the eye follows a branch to its end. */
  guides?: boolean | undefined
}

function Tree<T = unknown>({
  indent = 20,
  tree,
  guides = false,
  className,
  ...props
}: TreeProps<T>) {
  const containerProps: React.HTMLAttributes<HTMLDivElement> =
    tree && typeof tree.getContainerProps === 'function' ? tree.getContainerProps() : {}
  // The container props of headless-tree come first, so what the caller names (the aria-label of
  // the tree) wins over them.
  const mergedProps = { ...containerProps, ...props }

  // Extract style from mergedProps to merge with our custom styles
  const { style: propStyle, ...otherProps } = mergedProps

  // Merge styles
  const mergedStyle = {
    ...propStyle,
    '--tree-indent': `${indent}px`,
  } as React.CSSProperties

  return (
    <TreeContext.Provider
      value={{ indent, guides, tree: tree as TreeInstance<unknown> | undefined }}
    >
      <div
        className={cn('flex flex-col', className)}
        data-slot="tree"
        style={mergedStyle}
        {...otherProps}
      />
    </TreeContext.Provider>
  )
}

interface TreeItemProps<T = unknown> extends React.HTMLAttributes<HTMLButtonElement> {
  item: ItemInstance<T>
  indent?: number
  asChild?: boolean
}

function TreeItem<T = unknown>({
  item,
  className,
  asChild,
  children,
  ...props
}: Omit<TreeItemProps<T>, 'indent'>) {
  const { indent, guides } = useTreeContext<T>()

  const itemProps: React.HTMLAttributes<HTMLButtonElement> =
    typeof item.getProps === 'function' ? item.getProps() : {}
  const mergedProps = { ...props, ...itemProps }

  // Extract style from mergedProps to merge with our custom styles
  const { style: propStyle, ...otherProps } = mergedProps

  // Merge styles
  const mergedStyle = {
    ...propStyle,
    '--tree-padding': `${item.getItemMeta().level * indent}px`,
  } as React.CSSProperties

  const Comp = asChild ? Slot.Root : 'button'

  return (
    <TreeContext.Provider value={{ currentItem: item as ItemInstance<unknown>, indent, guides }}>
      <Comp
        aria-expanded={item.isFolder() ? item.isExpanded() : undefined}
        className={cn(
          'z-10 ps-(--tree-padding) outline-hidden select-none not-last:pb-0.5 focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          // A line at each level of indent, one pixel wide, drawn in the padding of the row: the row
          // is as wide as its own indent, so a line never crosses its title.
          'data-[guides]:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))] data-[guides]:bg-size-[var(--tree-padding)_100%] data-[guides]:bg-no-repeat',
          className,
        )}
        data-drag-target={
          typeof item.isDragTarget === 'function' ? item.isDragTarget() || false : undefined
        }
        data-focus={typeof item.isFocused === 'function' ? item.isFocused() || false : undefined}
        data-guides={guides ? '' : undefined}
        data-folder={typeof item.isFolder === 'function' ? item.isFolder() || false : undefined}
        data-search-match={
          typeof item.isMatchingSearch === 'function' ? item.isMatchingSearch() || false : undefined
        }
        data-selected={
          typeof item.isSelected === 'function' ? item.isSelected() || false : undefined
        }
        data-slot="tree-item"
        style={mergedStyle}
        {...otherProps}
      >
        {children}
      </Comp>
    </TreeContext.Provider>
  )
}

interface TreeItemLabelProps<T = unknown> extends React.HTMLAttributes<HTMLSpanElement> {
  item?: ItemInstance<T>
}

function TreeItemLabel<T = unknown>({
  item: propItem,
  children,
  className,
  ...props
}: TreeItemLabelProps<T>) {
  const { currentItem } = useTreeContext<T>()
  const item = propItem || currentItem

  // Rendered outside a TreeItem and without an item: nothing to label.
  if (!item) {
    return null
  }

  return (
    <span
      className={cn(
        'flex items-center gap-1 rounded-sm px-2 py-1 text-xs/relaxed transition-colors not-in-data-[folder=true]:ps-7 hover:bg-accent in-focus-visible:ring-2 in-focus-visible:ring-ring/30 in-data-[drag-target=true]:bg-accent in-data-[search-match=true]:bg-primary/20! in-data-[selected=true]:bg-accent in-data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0',
        className,
      )}
      data-slot="tree-item-label"
      {...props}
    >
      {item.isFolder() && (
        <ChevronDownIcon className="size-4 text-muted-foreground in-aria-[expanded=false]:-rotate-90" />
      )}
      {children || (typeof item.getItemName === 'function' ? item.getItemName() : null)}
    </span>
  )
}

function TreeDragLine({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { tree } = useTreeContext()

  // Drag and drop is a feature of the tree; without it there is no line to draw.
  if (!tree || typeof tree.getDragLineStyle !== 'function') {
    return null
  }

  const dragLine: React.CSSProperties = tree.getDragLineStyle()
  return (
    <div
      className={cn(
        'absolute z-30 -mt-px h-0.5 w-[unset] bg-primary before:absolute before:-top-[3px] before:left-0 before:size-2 before:rounded-full before:border-2 before:border-primary before:bg-background',
        className,
      )}
      style={dragLine}
      {...props}
    />
  )
}

export { Tree, TreeDragLine, TreeItem, TreeItemLabel }
