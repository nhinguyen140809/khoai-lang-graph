'use client'

import { ListFilterIcon } from 'lucide-react'
import { type ComponentProps, useState } from 'react'

import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'

import { filterMessages } from './filter.constants'
import type { FilterField, FilterValues } from './filter.types'
import { activeFilterCount } from './filter.utils'
import { useFilterDraft } from './hooks/useFilterDraft'

interface FilterMenuProps {
  fields: readonly FilterField[]
  /** The values applied to the list. */
  values: FilterValues
  onApply: (values: FilterValues) => void
}

/**
 * The button that filters a list, and the form it opens: a row of choices for each filter. What
 * the user chooses applies to the list only with Apply; closing the form drops it, and the form
 * opens again on the values applied. The button counts the filters applied.
 */
export function FilterMenu({ fields, values, onApply }: FilterMenuProps) {
  const [open, setOpen] = useState(false)
  const draft = useFilterDraft(values)
  const count = activeFilterCount(values)
  const hasNothingToClear = count === 0 && activeFilterCount(draft.values) === 0

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) draft.reset()
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline">
          <ListFilterIcon aria-hidden />
          {filterMessages.open}
          {count > 0 && (
            <>
              <Badge aria-hidden variant="soft" color="primary" className="tabular-nums">
                {count}
              </Badge>
              <span className="sr-only">
                , {count} {filterMessages.applied}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-label={filterMessages.title}
        className="w-96 max-w-popover gap-0 p-0"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onApply(draft.values)
            setOpen(false)
          }}
        >
          <div className="flex flex-col gap-4 p-4">
            {fields.map((field) => (
              <fieldset key={field.key}>
                <legend className="mb-2 text-sm font-semibold">{field.label}</legend>
                <div className="flex flex-wrap gap-2">
                  {field.options.map((option) => (
                    <FilterChip
                      key={option.value}
                      pressed={draft.values[field.key]?.includes(option.value) ?? false}
                      onClick={() => {
                        draft.toggle(field, option.value)
                      }}
                    >
                      {option.label}
                    </FilterChip>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3">
            {/* A link in the color of the text, so that Apply stays the one action of the form. */}
            <Button
              type="button"
              variant="link"
              className="h-auto px-0 text-muted-foreground hover:text-foreground"
              disabled={hasNothingToClear}
              onClick={draft.clear}
            >
              {filterMessages.clear}
            </Button>
            <Button type="submit">{filterMessages.apply}</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

interface FilterChipProps extends Omit<ComponentProps<'button'>, 'type'> {
  pressed: boolean
}

/**
 * One value of a filter, chosen or not. A chosen value has a soft fill of the primary color and
 * an outline, so that it stands out among the others, while Apply keeps the solid one and stays
 * the strongest part of the form. The pointer over a value darkens its fill.
 */
function FilterChip({ pressed, ...props }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className="h-7 max-w-48 truncate rounded-md bg-foreground/5 px-3 text-sm text-foreground/70 transition-colors outline-none not-aria-pressed:hover:bg-foreground/15 not-aria-pressed:hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-pressed:bg-primary/15 aria-pressed:text-primary aria-pressed:inset-ring-1 aria-pressed:inset-ring-primary/60 aria-pressed:hover:bg-primary/25 motion-reduce:transition-none dark:aria-pressed:bg-primary/20 dark:aria-pressed:hover:bg-primary/30"
      {...props}
    />
  )
}
