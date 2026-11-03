'use client'

import { DiffView } from '@/shared/components/ui/diff-view'

import { rationaleV4, statementV3, statementV4 } from '../../design-system.fixtures'
import { SampleCard, SampleGroup } from '../Sample'

export function DiffViewCard() {
  return (
    <SampleCard
      title="Diff view"
      description={
        <>
          One text with the words that changed from another: the words that only the old text holds
          are struck through in red, the words the new one brings are in green, and the rest reads
          as it was. The words are compared, not the lines, so a change reads where it sits in its
          sentence.
        </>
      }
      className="flex flex-col gap-4"
    >
      <SampleGroup label="a statement, version 3 to version 4">
        <DiffView before={statementV3} after={statementV4} className="text-sm" />
      </SampleGroup>
      <SampleGroup label="a short field">
        <DiffView before="must" after="should" className="text-sm" />
      </SampleGroup>
      <SampleGroup label="a field that version 4 brought">
        <DiffView before="" after={rationaleV4} className="text-sm" />
      </SampleGroup>
    </SampleCard>
  )
}
