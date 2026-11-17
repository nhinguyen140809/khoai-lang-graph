'use client'

import type { ReactNode } from 'react'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

import { filterMessages } from './filter.constants'
import type { FilterField, FilterValues } from './filter.types'
import { activeFilterCount } from './filter.utils'

interface FilterDropdownProps {
  fields: readonly FilterField[]
  /** The values that narrow the list. */
  values: FilterValues
  /** Chooses a value of a filter, or no longer chooses it. */
  onToggle: (field: FilterField, value: string) => void
  onClear: () => void
  /** The button that opens the menu. */
  children: ReactNode
}

/**
 * A compact form of the filters of a list: a menu with an entry for each filter, which opens the
 * values of the filter beside it when the pointer rests on it, or with the arrow keys. A choice
 * narrows the list at once and keeps the menu open, to choose more. The entries come from `fields`,
 * so a list gets a filter by describing it there.
 */
export function FilterDropdown({
  fields,
  values,
  onToggle,
  onClear,
  children,
}: FilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="right"
        className="w-52"
        aria-label={filterMessages.title}
      >
        {fields.map((field) => (
          <DropdownMenuSub key={field.key}>
            <DropdownMenuSubTrigger>
              <span className="truncate">{field.label}</span>
              {(values[field.key]?.length ?? 0) > 0 && (
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {values[field.key]?.length}
                </span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              {field.options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={values[field.key]?.includes(option.value) ?? false}
                  onCheckedChange={() => {
                    onToggle(field, option.value)
                  }}
                  // Keeps the menu open, so that a filter can take several values.
                  onSelect={(event) => {
                    event.preventDefault()
                  }}
                >
                  <span className="truncate">{option.label}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
        {activeFilterCount(values) > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onClear}>{filterMessages.clear}</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
