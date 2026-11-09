'use client'

import type { ArtifactItem } from '@/modules/artifact/entities'
import { linkTargetsPageSize } from '@/modules/trace/entities'
import { useItemTitleOf, useKindTitles } from '@/modules/workflow/entities'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/shared/components/ui/combobox'
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field'
import { RecordName } from '@/shared/components/ui/record-name'

import { addLinkMessages } from '../add-link.constants'

interface LinkTargetFieldProps {
  /** The items that the search found. */
  targets: ArtifactItem[]
  chosen: ArtifactItem | null
  /** Whether the search has its first key, so that "no result" can be said. */
  isSearchStarted: boolean
  error: string | undefined
  onChoose: (item: ArtifactItem | null) => void
  onSearch: (text: string) => void
}

/**
 * The field of the other item of a link: a combobox that searches the items as the user types, each
 * result named by its kind and title with its key last, and a word when there may be more than it
 * shows.
 */
export function LinkTargetField({
  targets,
  chosen,
  isSearchStarted,
  error,
  onChoose,
  onSearch,
}: LinkTargetFieldProps) {
  const titleOf = useItemTitleOf()
  const kindTitles = useKindTitles()

  return (
    <Field>
      <FieldLabel htmlFor="add-link-target">{addLinkMessages.target}</FieldLabel>
      <Combobox
        items={targets}
        value={chosen}
        isItemEqualToValue={(item, value) => item.id === value.id}
        itemToStringLabel={(item) => titleOf(item)}
        onValueChange={onChoose}
        onInputValueChange={onSearch}
      >
        <ComboboxInput id="add-link-target" placeholder={addLinkMessages.targetPlaceholder} />
        <ComboboxContent>
          {isSearchStarted && <ComboboxEmpty>{addLinkMessages.noResults}</ComboboxEmpty>}
          <ComboboxList>
            {(item: ArtifactItem) => (
              <ComboboxItem key={item.id} value={item}>
                <RecordName
                  kind={kindTitles.get(item.kind) ?? item.kind}
                  title={titleOf(item)}
                  code={item.key}
                  layout="stacked"
                />
              </ComboboxItem>
            )}
          </ComboboxList>
          {targets.length >= linkTargetsPageSize && (
            <p className="px-3 py-2 text-xs text-muted-foreground">{addLinkMessages.moreResults}</p>
          )}
        </ComboboxContent>
      </Combobox>
      <FieldError>{error}</FieldError>
    </Field>
  )
}
